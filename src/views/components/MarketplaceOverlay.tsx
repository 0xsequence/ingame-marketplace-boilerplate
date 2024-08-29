import {useEffect, useState} from 'react'
import { Modal, Box, Button, TextInput, Tabs, Card, useTheme, Spinner } from "@0xsequence/design-system";
import Collectible from "./Collectible";
import { AnimatePresence } from "framer-motion";
import { useAccount, useSendTransaction, useConnect } from 'wagmi';
import { useAddFundsModal } from '@0xsequence/kit-checkout'
import { SequenceIndexer } from '@0xsequence/indexer'
import SequenceMarketABI from '../../abi/ISequenceMarketplace.json'
import {ethers} from 'ethers'
import { sendTransaction } from "@wagmi/core";
import {config} from '../../config'
import { useWaasFeeOptions } from '@0xsequence/kit'
import { findSupportedNetwork } from '@0xsequence/network'

const styles = {
  inputDate: {
    width: '100%',
    padding: '8px',
    boxSizing: 'border-box',
  }
}

const validateMarketplaceOverlayProps = (props: any) => {
  const {
      hasMint,
      isOpen,
      toggleModal,
      tokenIDs,
      paymentToken,
      contractAddress,
      network,
      minterURL,
  } = props;

  if (typeof hasMint !== 'boolean') {
      console.error("`hasMint` should be a boolean.");
  }

  if (typeof isOpen !== 'boolean') {
      console.error("`isOpen` should be a boolean.");
  }

  if (typeof toggleModal !== 'function') {
      console.error("`toggleModal` should be a function.");
  }

  if (!Array.isArray(tokenIDs) || tokenIDs.length === 0) {
      console.error("`tokenIDs` should be a non-empty array.");
  }

  if (typeof paymentToken !== 'string' || paymentToken.trim() === '') {
      console.error("`paymentToken` should be a non-empty string.");
  }

  if (typeof contractAddress !== 'string' || contractAddress.trim() === '') {
      console.error("`contractAddress` should be a non-empty string.");
  }

  if (typeof network !== 'string' || network.trim() === '') {
      console.error("`network` should be a non-empty string.");
  }

  if (hasMint) {
      if (typeof minterURL !== 'string' || minterURL.trim() === '') {
          console.error("`minterURL` is required when `hasMint` is true and should be a non-empty string.");
      }
  } else {
      console.warn("`minterURL` is not required because `hasMint` is set to false.");
  }
};

const networks = {
  AMOY: 80002,
  APE_CHAIN_TESTNET: 33111,
  ARBITRUM: 42161,
  ARBITRUM_GOERLI: 421613,
  ARBITRUM_NOVA: 42170,
  ARBITRUM_SEPOLIA: 421614,
  AVALANCHE: 43114,
  AVALANCHE_TESTNET: 43113,
  BASE: 8453,
  BASE_SEPOLIA: 84532,
  B3_SEPOLIA: 1993,
  BLAST: 81457,
  BLAST_SEPOLIA: 168587773,
  BORNE_TESTNET: 94984,
  BSC: 56,
  BSC_TESTNET: 97,
  GNOSIS: 100,
  GOERLI: 5,
  HOMEVERSE: 19011,
  HOMEVERSE_TESTNET: 40875,
  IMMUTABLE_ZKEVM: 13371,
  IMMUTABLE_ZKEVM_TESTNET: 13473,
  KOVAN: 42,
  MAINNET: 1,
  OPTIMISM: 10,
  OPTIMISM_SEPOLIA: 11155420,
  OPTIMISM_TESTNET: 69,
  POLYGON: 137,
  POLYGON_AMOY: 80002,
  POLYGON_ZKEVM: 1101,
  RINKEBY: 4,
  ROPSTEN: 3,
  SEPOLIA: 11155111,
  ASTAR_ZKEVM: 3776,
  ASTAR_ZKYOTO: 6038361,
  XAI: 660279,
  XAI_SEPOLIA: 37714555429,
  XR_SEPOLIA: 2730
};

const tokenNamesByNetwork: any = {
  [networks.MAINNET]: 'Ether',
  [networks.SEPOLIA]: 'Ether',
  [networks.OPTIMISM]: 'Ether',
  [networks.OPTIMISM_SEPOLIA]: 'Ether',
  [networks.POLYGON]: 'MATIC',
  [networks.POLYGON_AMOY]: 'MATIC',
  [networks.POLYGON_ZKEVM]: 'Ether',
  [networks.ARBITRUM]: 'Ether',
  [networks.ARBITRUM_GOERLI]: 'Ether',
  [networks.ARBITRUM_NOVA]: 'Ether',
  [networks.ARBITRUM_SEPOLIA]: 'Ether',
  [networks.AVALANCHE]: 'Avax',
  [networks.AVALANCHE_TESTNET]: 'Avax',
  [networks.BASE]: 'Ether',
  [networks.BASE_SEPOLIA]: 'Ether',
  [networks.BSC]: 'BNB',
  [networks.BSC_TESTNET]: 'BNB',
  [networks.GNOSIS]: 'xDAI',
  [networks.ASTAR_ZKEVM]: 'Astr',
  [networks.IMMUTABLE_ZKEVM]: 'IMX',
  [networks.IMMUTABLE_ZKEVM_TESTNET]: 'IMX',
  [networks.HOMEVERSE]: 'OAS',
  [networks.HOMEVERSE_TESTNET]: 'OAS',
  [networks.AMOY]: 'MATIC',
  [networks.APE_CHAIN_TESTNET]: 'APE',
  [networks.BLAST]: 'Ether',
  [networks.BLAST_SEPOLIA]: 'Ether',
  [networks.B3_SEPOLIA]: 'Ether',
  [networks.XR_SEPOLIA]: 'Ether',
  [networks.XAI]: 'Ether',
  [networks.XAI_SEPOLIA]: 'Ether',
};

async function getContractBytecode(provider: any, contractAddress: string) {
  // storage slot consistent location where proxies store the address of the logic contract they delegate to
    const implementationSlot = "0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50";
    try {
        const storageValue1 = await provider.getStorageAt(contractAddress, implementationSlot);
    return storageValue1
    } catch (error) {
        console.error("Error fetching bytecode:", error);
    return null
    }
}

const isNotValidERC721ContractAddress = async (provider: any, contractAddress: string) => {
  return await getContractBytecode(provider, contractAddress) != '0x000000000000000000000000f625720cdd63a65a5b7b31e7d0e64ae1ce08e52c'
}

let interval: any;

const MarketplaceOverlay = (props: any) => {
  validateMarketplaceOverlayProps(props);
  const {address} = useAccount()
  const [isOpen, toggleModal] = useState(props.isOpen);
  const {theme} = useTheme()
  const [view, setView] = useState(0)
  const [count, setCount] = useState(0)
  const { triggerAddFunds: toggleAddFunds } = useAddFundsModal()
  const [tokenBalance, setTokenBalance] = useState(0)
  const [tokenName, setTokenName] = useState('')
  const [inProgressSaleTokenID, setInProgressSaleTokenID] = useState<any>(null)
  const [paymentTokenName, setPaymentTokenName] = useState('')
  const [pendingFeeOptionConfirmation, confirmPendingFeeOption] = useWaasFeeOptions()
  const [nativeBalance, setNativeBalance] = useState<any>(0)
  const [dateTime, setDateTime] = useState<any>('');
  const [price, setPrice] = useState(0)
  const [quantity, setQuantity] = useState(0)
  const [hasSufficientToken, setHasSufficientToken] = useState(true)
  const [notEnoughFundsForGas, setNotEnoughFundsForGas] = useState(false)
  const { data: txnData} = useSendTransaction()
  const [isPending, setIsPending] = useState(false)
  const [userOwnedItems, setUserOwnedItems] = useState([])
  const [paymentTokenDecimal,setPaymentTokenDecimal] = useState(0)
  const [isSequence, setIsSequence] = useState(false)
  const [nativeTokenName,setNativeTokenName] = useState('')
  const { connectors } = useConnect();

  useEffect(() => {
    setTimeout(async () => {
      connectors.map(async (connector) => {
        if (await connector.isAuthorized()) {
          if (connector.id == "sequence-waas") {
            setIsSequence(true);
          }
        }
      })
  },0)

  setTimeout(() => {
    const networkDetails = findSupportedNetwork(props.network);
    const nativeToken = tokenNamesByNetwork[networkDetails?.chainId!];
    setNativeTokenName(nativeToken)
  },0)
},[])

  useEffect(() => {

  }, [isSequence, userOwnedItems])
  useEffect(() => {
    console.log(theme)
    if (txnData) {
      console.log(txnData)
    }
  }, [txnData])

  useEffect(() => {
  }, [isOpen])

  useEffect(() => {
    console.log(props.isOpen)
    toggleModal(props.isOpen)
  }, [props.isOpen])

  useEffect(() => {
    const networkDetails = findSupportedNetwork(props.network);
    const nativeToken = tokenNamesByNetwork[networkDetails?.chainId!];

    if (pendingFeeOptionConfirmation) {
      console.log(nativeToken)

      const selected: any = pendingFeeOptionConfirmation?.options?.find((option) => {
        console.log(option)
        return option.token.symbol === nativeToken

      })
      console.log(selected)
      confirmPendingFeeOption(pendingFeeOptionConfirmation?.id!, selected.token.contractAddress)
    }
  }, [pendingFeeOptionConfirmation])

  const observeAppRoot = () => {
    const appRoot = document.getElementsByClassName('fyvr11sd fyvr11nk fyvr11hs fyvr128 fyvr11ic fyvr11ko fyvr11jw fyvr11h0')[0]
    console.log(appRoot)
    if (appRoot) {
      (document.getElementsByClassName('fyvr11sd fyvr11nk fyvr11hs fyvr128 fyvr11ic fyvr11ko fyvr11jw fyvr11h0')[0]as any).style!.scale! = '0.8'
    } else {
      console.log('retrying')
      // Retry after a short delay if appRoot isn't found yet
      setTimeout(observeAppRoot, 0);
    }

    if (appRoot) {
      // @ts-ignore
      (document.getElementsByClassName('fyvr11sd _1vqx0w91 _1vqx0w90 fyvr128 fyvr15o _1vqx0w92')[0]as any).style!.overflow! = 'hidden';
      (document.getElementsByClassName('fyvr1u4 fyvr1w0 fyvr1xw fyvr1zs fyvr11i4 fyvr11jw fyvr15o fyvr11h0')[0]as any).style!.padding! = '35px'

    } else {
      setTimeout(observeAppRoot, 0);
    }
  };

  const observeAppRoot2 = () => {
    const appRoot = document.getElementsByClassName('fyvr11sd _1vqx0w91 _1vqx0w90 fyvr128 fyvr15o _1vqx0w92')[0]

    if (appRoot) {
      (appRoot as HTMLElement).style.overflow = 'hidden';
      const element = document.getElementsByClassName('fyvr1u4 fyvr1w0 fyvr1xw fyvr1zs fyvr11i4 fyvr11jw fyvr15o fyvr11h0')[0] as HTMLElement;

      if (element) {
        element.style.padding = '35px';
        element.style.margin = '30px';
      }

      (appRoot as HTMLElement).style.background = props.primaryBackgroundColor;

    } else {
      console.log('retrying')
      // Retry after a short delay if appRoot isn't found yet
      setTimeout(observeAppRoot2, 100);
    }
  }

  const observeCardChange = () => {
    const root = document.documentElement;
  
    if (props.secondaryCardColor) {
      root.style.setProperty('--secondary-card-color', props.secondaryCardColor);
    } else {
      root.style.setProperty('--secondary-card-color', theme == 'light'?'white':'#1a1a1a');

      setTimeout(observeCardChange, 0);
    }
  };

  const onClick = () => {
    (document.getElementsByClassName('_5b32m91 _5b32m90 fyvr11jg fyvr11ko fyvr11h0 fyvr11hs fyvr11nk fyvr1ko fyvr1oo fyvr1qo fyvr1mo')[0] as any).style!.zIndex = 0;

    toggleAddFunds({
      walletAddress: address!,
    })

    observeAppRoot();
  }

  const onMintClick = async (tokenID: number) => {
    console.log(address)
      try {
        const response = await fetch(props.minterURL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ address, tokenID }) // Pass the tokenID in the body
        });
    
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
    
        setCount(count+1)
      } catch (error) {
        alert('Cloudflare Worker Error')
        console.error('Error performing POST request:', error);
        throw error;

      }
  }
    const onAcceptOrder = async (orderID: number, price: string) => {
      const sequenceMarketInterface = new ethers.utils.Interface(
        SequenceMarketABI.abi,
      );
      const erc20Interface = new ethers.utils.Interface([
        "function approve(address spender, uint256 amount) public returns (bool)",
      ]);

      const amountBigNumber = ethers.utils.parseUnits(String(price), paymentTokenDecimal); // Convert 1 token to its smallest unit based on 18 decimals

      const dataApprove = erc20Interface.encodeFunctionData("approve", [
        "0xB537a160472183f2150d42EB1c3DD6684A55f74c",
        amountBigNumber,
      ]);

      const data = sequenceMarketInterface.encodeFunctionData(
        "acceptRequest",
        [orderID, 1, address, [], []],
      );

      try {
        await sendTransaction(config, {
          to: props.paymentToken,
          data: dataApprove as `0x${string}`,
          gas: null
        });

        await sendTransaction(config, {
          to: "0xB537a160472183f2150d42EB1c3DD6684A55f74c",
          data: data as `0x${string}`,
          gas: null
        });
        // throw new Error()
        setTimeout(() => {
          getTopOrders()
        }, 1000)
      }catch(err){
        setView(1)
      }
    }

    const getNativeBalance = async () => {
      const indexer = new SequenceIndexer(`https://${props.network}-indexer.sequence.app`, import.meta.env.VITE_PROJECT_ACCESS_KEY!)
  
      // try any contract and account address you'd like :)
      const accountAddress = address
      
      // query Sequence Indexer for all nft balances of the account on Polygon
      const nftBalances = await indexer.getEtherBalance({
        accountAddress: accountAddress,
      })
      
      setNativeBalance(ethers.utils.formatUnits(nftBalances.balance.balanceWei.toString(), "ether").toString().slice(0,7));
    }

    const getERC20Balance = async () => {
      const indexer = new SequenceIndexer(`https://${props.network}-indexer.sequence.app`, import.meta.env.VITE_PROJECT_ACCESS_KEY!)
  
      const contractAddress = props.paymentToken
      const accountAddress = address

      const nftBalances = await indexer.getTokenBalances({
        contractAddress: contractAddress,
        accountAddress: accountAddress,
        includeMetadata: true
      })
      
      nftBalances.balances.map((balance) => {
        if(balance.contractAddress.toLowerCase() == contractAddress.toLowerCase()){
          setTokenBalance(Number(balance.balance)/(10**Number(balance.contractInfo?.decimals)))
          setTokenName(balance.contractInfo?.name!)
        }
      })
    }
    const subscribeToBalanceChanges = async () => {
      const indexer = new SequenceIndexer(`https://${props.network}-indexer.sequence.app`, 'c3bgcU3LkFR9Bp9jFssLenPAAAAAAAAAA')
 
      const req = {
          filter: {
            contractAddresses: [props.paymentToken],
            accounts: [address as string],
            events: [
              'Transfer(address indexed from, address indexed to, uint256 value)',
            ]
          },
      }
      
      console.log(req)
      const options = {
        onMessage: () => {
          getERC20Balance()
        },
        onError: (err: any) => {
          console.error('err', err)
        }
      }
      
      console.log(await indexer.subscribeEvents(req, options))
    
    }

    const getPaymentTokenDetails = async () => {
      const res = await fetch(`https://metadata.sequence.app/tokens/${props.network}/${props.paymentToken}/`)
      const json = await res.json()
      setPaymentTokenName(json.name)
      setPaymentTokenDecimal(json.decimals)
    }
    useEffect(() => {
      address && getERC20Balance()
      address && subscribeToBalanceChanges()
      getPaymentTokenDetails()
    }, [address])

    useEffect(() => {
    }, [count, inProgressSaleTokenID])

    const onCreateRequest = (tokenID: number) => {
      setInProgressSaleTokenID(tokenID)
    }

    const createSellRequest = async (tokenID: number) => {
      const chainConfig = findSupportedNetwork(props.network)!;

      const provider = new ethers.providers.StaticJsonRpcProvider({
        url: chainConfig.rpcUrl, 
      })

      const commonInterface = new ethers.utils.Interface([
        "function isApprovedForAll(address owner, address operator) external view returns (bool)",
      ]);

      const contractAddress = props.contractAddress; // Replace with your contract address
      const contract = new ethers.Contract(contractAddress, commonInterface, provider);

      async function checkApprovalForAll(owner: any, operator: any) {
          return await contract.isApprovedForAll(owner, operator);
      }

      const owner = address; // Replace with the owner address
      const operator = "0xB537a160472183f2150d42EB1c3DD6684A55f74c"; // Replace with the operator address

      const isApprovedForAll = await checkApprovalForAll(owner, operator);

      const erc1155Interface = new ethers.utils.Interface([
        "function setApprovalForAll(address operator, bool approved) external",
      ]);

      const sequenceMarketInterface = new ethers.utils.Interface(
        SequenceMarketABI.abi,
      );

      const amountBigNumber = ethers.utils.parseUnits(String(price), paymentTokenDecimal);

      const request = {
        creator: address,
        isListing: true,
        isERC1155: await isNotValidERC721ContractAddress(provider, props.contractAddress),
        tokenContract: props.contractAddress,
        tokenId: tokenID,
        quantity: quantity,
        expiry: dateTime,
        currency: props.paymentToken,
        pricePerToken: amountBigNumber.toString(),
      };

      const data = sequenceMarketInterface.encodeFunctionData("createRequest", [
        request,
      ]);

      const dataApprove = erc1155Interface.encodeFunctionData(
        "setApprovalForAll",
        ["0xB537a160472183f2150d42EB1c3DD6684A55f74c", true],
      );

      try {
        setIsPending(true)
        !isApprovedForAll && console.log(await sendTransaction(config, {
          to: props.contractAddress,
          data: dataApprove as `0x${string}`,
          gas: null,
        }))
  
        console.log(await sendTransaction(config, {
          to: "0xB537a160472183f2150d42EB1c3DD6684A55f74c",
          data: data as `0x${string}`,
          gas: null,
        }))
        setInProgressSaleTokenID(null)
        getUserBalance()
        setDateTime(null)
        setIsPending(false)
      }catch(err){
        setNotEnoughFundsForGas(true)
        setIsPending(false)

      }
    }

    const [marketSellOrders, setMarketSellOrders] = useState([])
    const [mintableCollectibles, setMintableCollectible] = useState<any>([])

    const getTopOrders = async () => {
        const res = await fetch(
          `https://marketplace-api.sequence.app/${props.network}/rpc/Marketplace/GetTopOrders`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              collectionAddress: props.contractAddress,
              currencyAddresses: [props.paymentToken],
              orderbookContractAddress:
                "0xB537a160472183f2150d42EB1c3DD6684A55f74c",
              tokenIDs: props.tokenIDs,
              isListing: true,
              priceSort: "DESC",
            }),
          },
        );
        const result = await res.json();
        const orders = result.orders.map((order: any) => {
          return <Collectible paymentToken={props.paymentToken} address={address} pricePerToken={order.pricePerToken} tokenID={order.tokenId} network={props.network} contractAddress={props.contractAddress} callToAction={isSequence ? 'Purchase Instant' : 'Purchase'} onClick={() => onAcceptOrder(order.orderId, order.pricePerToken)}/>
        })
        setMarketSellOrders(orders)
    }
    useEffect(() => {
      if(view == 2||view == 0){
        getTopOrders()
      }
    }, [view])

    useEffect(() => {
      console.log(view)
    }, [marketSellOrders, view])

    const getUserBalance = async () => {
      try {
        const indexer = new SequenceIndexer(
          `https://${props.network}-indexer.sequence.app`, 
          import.meta.env.VITE_PROJECT_ACCESS_KEY!
        );
    
        const contractAddress = props.contractAddress;
        const accountAddress = address;
    
        // Query Sequence Indexer for all NFT balances of the account on Polygon
        const nftBalances = await indexer.getTokenBalances({
          contractAddress: contractAddress,
          accountAddress: accountAddress,
          includeMetadata: true
        });
    
        let tempUserOwnerBalances: any = [];
        nftBalances.balances.map((balance) => {
          if (balance.contractAddress.toLowerCase() === contractAddress.toLowerCase()) {
            tempUserOwnerBalances.push(
              <Collectible 
                view={view}
                tokenID={balance.tokenID} 
                network={props.network} 
                contractAddress={props.contractAddress} 
                callToAction={'Sell'} 
                onClick={onCreateRequest}
              />
            );
          }
        });
    
        setUserOwnedItems(tempUserOwnerBalances);
      } catch (error) {
        setTimeout(getUserBalance, 1000); // Retry after 1000 ms
      }
    };
    
    const getUserBalanceForOrder = async () => {
      const indexer = new SequenceIndexer(`https://${props.network}-indexer.sequence.app`, import.meta.env.VITE_PROJECT_ACCESS_KEY!)
  
      // try any contract and account address you'd like :)
      const contractAddress = props.contractAddress
      const accountAddress = address
      
      // query Sequence Indexer for all nft balances of the account on Polygon
      const nftBalances: any = await indexer.getTokenBalances({
        contractAddress: contractAddress,
        accountAddress: accountAddress,
        includeMetadata: true
      })
      
      let tempUserOwnerBalances: any = []
      nftBalances.balances.map((balance: any) => {
        if(balance.contractAddress.toLowerCase() == contractAddress.toLowerCase() && Number(balance.balance) < quantity){
          setHasSufficientToken(false)
        } else {
        setHasSufficientToken(true)
        }
      })

      setUserOwnedItems(tempUserOwnerBalances)
    }

    const populateMintableCollectibles = async () => {
      try {
        const collectiblePromises = props.tokenIDs.map(async (tokenID: any) => {
          try {
            const res = await fetch(`${props.minterURL}`, {
              headers: {
                'Content-Type': 'application/json',
              },
            });
    
            if (res.status === 200) {
              return (
                <Collectible
                  key={tokenID}
                  minterURL={props.minterURL}
                  tokenID={tokenID}
                  network={props.network}
                  contractAddress={props.contractAddress}
                  callToAction={'Mint Instant'}
                  onClick={() => onMintClick(tokenID)}
                  onUpdateCount={count}
                />
              );
            } else {
              throw new Error('Non-200 status code');
            }
          } catch (err) {
            return (
              <Collectible
                key={tokenID}
                minterURL={props.minterURL}
                tokenID={tokenID}
                network={props.network}
                contractAddress={props.contractAddress}
                callToAction={'Server Error'}
                onClick={() => onMintClick(tokenID)}
                onUpdateCount={count}
              />
            );
          }
        });
    
        const collectibles = await Promise.all(collectiblePromises);
        setMintableCollectible(collectibles);
      } catch (err) {
        console.error('Error populating collectibles:', err);
      }
    };

    useEffect(() => {
      if((view || view == 0)
        &&props.isOpen
      ){
        observeAppRoot2()
        observeCardChange()

      } 
    },[view, props.isOpen])

    useEffect(() => {

      setTimeout(() => {
        if(view == 3||view == 2){
          getUserBalance()
        }

        if(view == 0){
          populateMintableCollectibles()
        }
      }, 0)
      setHasSufficientToken(true)
    }, [view])

    useEffect(() => {
      console.log(mintableCollectibles)
    },[mintableCollectibles])

    useEffect(() => {
        getUserBalanceForOrder()
        setNotEnoughFundsForGas(false)
    }, [quantity])

    useEffect(() => {

    }, [notEnoughFundsForGas])

    const [tabHeaders, setHeaders] = useState<any>([])

    useEffect(() => {
      if(props.hasMint){
        setHeaders(['Mint', 'On-ramp', 'Market', 'Sell'])
      } else {
        setHeaders(['On-ramp', 'Market', 'Sell'])
      
      }
    }, [])

    useEffect(() => {
      if(theme == 'light' && (view || view == 0)){
        const texts = document.getElementsByTagName('h2')

        for(let i = 0; i < texts.length; i++){
          texts[i].style.color = 'black'
        }

      }
    }, [theme, view])

    useEffect(() => {
      
    },[isPending])

    return(
      <>      
        <AnimatePresence>
        {isOpen && (
          <Modal onClose={() => props.toggleModal(false)}>
            <Box
              flexDirection="column"
              justifyContent="space-between"
              height="full"
              padding="16"
            >
              {
                <Tabs
                    style={{outline: 'none', overflow: 'hidden'}}
                    onClick={(evt: any) => {
                      
                      observeAppRoot2()
                      observeCardChange()
                      const parser = new DOMParser();
                      const doc = parser.parseFromString(evt.target.innerHTML, 'text/html');
                      const element: any = doc.querySelector('span.fyvr11mv.fyvr11eg.fyvr11g0.fyvr11fs.fyvr11fc._1qxj1ib9');
                      clearInterval(interval)
                      if(element||evt.target.innerHTML){
                        const innerContent = element ? element.innerHTML.trim() : evt.target.innerHTML
                      switch(innerContent){
                        case 'Sell':
                          setView(2)
                          break;
                        case 'Market':
                          setView(0)
                          break;
                        case 'On-ramp':
                          getNativeBalance()
                          interval = setInterval(() => {
                            getNativeBalance()
                          }, 4000)
                          break;
                      }
                    }
                  }}
                  className="navBar"
                  defaultValue="Market"
                  tabs={
                    tabHeaders.map((category: any) => {
                      return {
                        label: `${category}`,
                        value: category,
                        content: (
                          <>
                          {
                              category == 'Market' 
                            ? 
                              view == 1 
                              ? 
                                <>
                                  <br/>
                                  <Button label="back" onClick={() => setView(0)}></Button>
                                  <br/>
                                  <br/>
                                  <span style={{color:'blueviolet'}}>User closed wallet, or, not enough gas to pay for transaction</span>
                                </>
                              : 
                                <div className="scrollable-container">
                                  {marketSellOrders.length == 0 ? (
                                  <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        
                                  <div style={{display: 'flex', justifyContent: 'center', width: '600px'}}>
                                  <h2 style={{color: theme == 'light'? 'black' : '', width: '100%', textAlign: 'center'}}>There are no orders</h2>
                                  </div>
                                </div>
                            ) : (
                              <>
                                {marketSellOrders}
                              </>
                            )}
                            <br/>
                            <br/>
                                </div>
                            :
                              category == 'Sell' 
                            ? 
                              inProgressSaleTokenID
                              ? 
                                <>
                                  <br/>
                                  <Card>
                                    <span style={{ padding: '0px', margin: '0px',color: theme == 'light'? 'black' : ''}}>
                                    Token ID: {inProgressSaleTokenID}, selling for {paymentTokenName}
                                    </span>
                                  <br/>
                                  <br/>
                                  <TextInput placeholder="price" onChange={(evt: any) => setPrice(evt.target.value)}></TextInput>
                                  <br/>
                                  <TextInput placeholder="quantity" onChange={(evt: any) => setQuantity(evt.target.value)}></TextInput>
                                  <br/>
                                  <div>
                                    <label style={{ color: theme == 'light'? 'black' : ''}}>Expiry</label>
                                    <input
                                      type="datetime-local"
                                      onChange={(e) => {
                                        const inputDate = new Date(e.target.value);
                                        const timestamp = inputDate.getTime();
                                        setDateTime(timestamp);
                                      }}
                                      // @ts-ignore
                                      style={styles.inputDate}
                                    />
                                  </div>
                                  <br/>
                                  <div>
                                    {
                                      isPending ?
                                      <Spinner/>
                                      :
                                      <Button onClick={() => createSellRequest(inProgressSaleTokenID)} disabled={price === 0 || quantity === 0 || !dateTime || !hasSufficientToken} label="Create Sell Order"></Button>
                                    }
                                    {!hasSufficientToken && <span style={{marginLeft:'147px', color:'red'}}>Insufficent collectible tokens</span>}
                                    {notEnoughFundsForGas && <span style={{marginLeft:'147px', color:'blueviolet'}}>Insufficent tokens for gas</span>}
                                  </div>
                                  </Card>
                                </>
                              : 
                                <>
                                  <div className="scrollable-container">
                                    {userOwnedItems.length == 0 ? (
                                      <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        
                                        <div style={{display: 'flex', justifyContent: 'center', width: '600px'}}>
                                        <h2 style={{color: theme == 'light'? 'black' : '', width: '100%', textAlign: 'center'}}>There are no owned items</h2>
                                        </div>
                                      </div>
                                    ) : (
                                        <>{userOwnedItems}</>
                                    )}
                                  <br/>
                                  <br/>
                                  <br/>
                                  <br/>
                                  </div>
                                </>
                            :
                              category == 'On-ramp' 
                          ?
                            <>
                              <br/>
                              <Card>
                              <p style={{color: theme == 'light'? 'black' : ''}}>Address: {`${address}`}</p>
                              <p style={{color: theme == 'light'? 'black' : ''}}>Network: {`${props.network}`}</p>
                              <br/>
                              <p style={{color: theme == 'light'? 'black' : ''}}>{tokenName} Balance: {tokenBalance}</p>
                              <p style={{color: theme == 'light'? 'black' : ''}}>{`${nativeTokenName} Balance: ${nativeBalance}`}</p>
                              <br/>
                              <Button variant='primary' label={'Add Funds'} onClick={onClick}></Button>
                              </Card>
                            </>
                          :
                            <>
                              <div className="scrollable-container" >
                                {mintableCollectibles.length == 0 ? (
                                      <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                        <div style={{display: 'flex', justifyContent: 'center', width: '600px'}}>
                                        <h2 style={{ color: theme == 'light'? 'black' : '', width: '100%', textAlign: 'center'}}>There are no mintable items</h2>
                                        </div>
                                      </div>
                                    ) : (
                                        <>{mintableCollectibles}</>
                                    )}
                                <br/>
                                <br/>
                              </div>
                            </>
                          }
                        </>),
                      }
                    })
                  }>
                </Tabs>
              }
            </Box>
            <br/>
          </Modal>
        )}
        </AnimatePresence>
    </>
  )
}

export default MarketplaceOverlay
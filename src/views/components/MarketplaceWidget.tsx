import {useEffect, useState} from 'react'
import { Modal, Box, Button, TextInput, Tabs, Card } from "@0xsequence/design-system";
import Collectible from "./Collectible";
import { AnimatePresence } from "framer-motion";
import { useAccount, useSendTransaction } from 'wagmi';
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

const validateMarketplaceWidgetProps = (props: any) => {
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
  BASE_GOERLI: 84531,
  BASE_SEPOLIA: 84532,
  B3_SEPOLIA: 1993,
  BLAST: 81457,
  BLAST_SEPOLIA: 168587773,
  BORNE_TESTNET: 94984,
  BSC: 56,
  BSC_TESTNET: 97,
  FANTOM: 250,
  FANTOM_TESTNET: 4002,
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
  [networks.AVALANCHE]: 'AVAX',
  [networks.AVALANCHE_TESTNET]: 'AVAX',
  [networks.BASE]: 'Ether',
  [networks.BASE_SEPOLIA]: 'Ether',
  [networks.BSC]: 'BNB',
  [networks.BSC_TESTNET]: 'BNB',
  [networks.GNOSIS]: 'xDAI',
  [networks.ASTAR_ZKEVM]: 'ASTR',
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

// Assuming findSupportedNetwork returns an object with chainId


const MarketplaceWidget = (props: any) => {
  validateMarketplaceWidgetProps(props);
  const {address} = useAccount()
  const [isOpen, toggleModal] = useState(props.isOpen);
  const [view, setView] = useState(0)
  const [count, setCount] = useState(0)
  const { triggerAddFunds: toggleAddFunds } = useAddFundsModal()
  const [tokenBalance, setTokenBalance] = useState(0)
  const [tokenName, setTokenName] = useState('')
  const [inProgressSaleTokenID, setInProgressSaleTokenID] = useState(0)
  const [paymentTokenName, setPaymentTokenName] = useState('')
  const [pendingFeeOptionConfirmation, confirmPendingFeeOption] = useWaasFeeOptions()
  const [nativeBalance, setNativeBalance] = useState<any>(0)
  const [dateTime, setDateTime] = useState<any>('');
  const [price, setPrice] = useState(0)
  const [quantity, setQuantity] = useState(0)
  const [hasSufficientToken, setHasSufficientToken] = useState(true)
  const [notEnoughFundsForGas, setNotEnoughFundsForGas] = useState(false)
  const { data: txnData } = useSendTransaction()
  const [userOwnedItems, setUserOwnedItems] = useState([])
  const [paymentTokenDecimal,setPaymentTokenDecimal] = useState(0)

  useEffect(() => {
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

      const selected: any = pendingFeeOptionConfirmation?.options?.find(
        option => option.token.name === nativeToken
      )
      confirmPendingFeeOption(pendingFeeOptionConfirmation?.id!, selected.token.contractAddress)
    }
  }, [pendingFeeOptionConfirmation])

  const observeAppRoot = () => {
    const appRoot = document.getElementsByClassName('fyvr11sd fyvr11nk fyvr11hs fyvr128 fyvr11ic fyvr11ko fyvr11jw fyvr11h0')[0]
    console.log(appRoot)
    if (appRoot) {
      (document.getElementsByClassName('fyvr11sd fyvr11nk fyvr11hs fyvr128 fyvr11ic fyvr11ko fyvr11jw fyvr11h0')[0]as any).style!.scale! = '0.8'

      // appRoot.style.transform = 'scale(0.8)';
    } else {
      console.log('retrying')
      // Retry after a short delay if appRoot isn't found yet
      setTimeout(observeAppRoot, 100);
    }

    if (appRoot) {
      // @ts-ignore
      (document.getElementsByClassName('fyvr11sd _1vqx0w91 _1vqx0w90 fyvr128 fyvr15o _1vqx0w92')[0]as any).style!.overflow! = 'hidden'
      (document.getElementsByClassName('fyvr1u4 fyvr1w0 fyvr1xw fyvr1zs fyvr11i4 fyvr11jw fyvr15o fyvr11h0')[0]as any).style!.padding! = '35px'

    } else {
      console.log('retrying')
      // Retry after a short delay if appRoot isn't found yet
      setTimeout(observeAppRoot, 100);
    }
  };

  const observeAppRoot2 = () => {
    const appRoot = document.getElementsByClassName('fyvr11sd _1vqx0w91 _1vqx0w90 fyvr128 fyvr15o _1vqx0w92')[0]

    if (appRoot) {
      (document.getElementsByClassName('fyvr11sd _1vqx0w91 _1vqx0w90 fyvr128 fyvr15o _1vqx0w92')[0]as any).style!.overflow! = 'hidden'

    } else {
      console.log('retrying')
      // Retry after a short delay if appRoot isn't found yet
      setTimeout(observeAppRoot2, 100);
    }
  }
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
        getTopOrders()
      }catch(err){
        setView(1)
      }
    }

    const getNativeBalance = async () => {
      const indexer = new SequenceIndexer(`https://${props.network}-indexer.sequence.app`, 'AQAAAAAAAF_JvPALhBthL7VGn6jV0YDqaFY')
  
      // try any contract and account address you'd like :)
      const accountAddress = address
      
      // query Sequence Indexer for all nft balances of the account on Polygon
      const nftBalances = await indexer.getEtherBalance({
        accountAddress: accountAddress,
      })
      
      console.log('native items', nftBalances)
      setNativeBalance(ethers.utils.formatUnits(nftBalances.balance.balanceWei.toString(), "ether").toString().slice(0,7));
    }

    const getERC20Balance = async () => {
      const indexer = new SequenceIndexer(`https://${props.network}-indexer.sequence.app`, 'AQAAAAAAAF_JvPALhBthL7VGn6jV0YDqaFY')
  
      // try any contract and account address you'd like :)
      const contractAddress = props.paymentToken
      const accountAddress = address
      console.log(address)
      
      // query Sequence Indexer for all nft balances of the account on Polygon
      const nftBalances = await indexer.getTokenBalances({
        contractAddress: contractAddress,
        accountAddress: accountAddress,
        includeMetadata: true
      })
      
      console.log('collection of items:', nftBalances)

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
        onMessage: (msg: any) => {
          console.log('msg', msg)
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
      console.log(json)
    }
    useEffect(() => {
      address && getNativeBalance()
      address && getERC20Balance()
      address && subscribeToBalanceChanges()
      getPaymentTokenDetails()
    }, [address])

    useEffect(() => {
    }, [count, inProgressSaleTokenID])

    const onCreateRequest = (tokenID: number) => {
      setInProgressSaleTokenID(tokenID)
      setView(3)
    }

    const createSellRequest = async (tokenID: number) => {
      const chainConfig = findSupportedNetwork(props.network)!;

      const provider = new ethers.providers.StaticJsonRpcProvider({
        url: chainConfig.rpcUrl, 
        // skipFetchSetup: true // Required for ethers.js Cloudflare Worker support
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
      console.log("Approved for All:", isApprovedForAll);

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
        isERC1155: true,
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

      console.log(data)
      console.log(dataApprove)
      try {
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
        // throw new Error()
        setView(2)
        setDateTime(null)
      }catch(err){
        console.log(err)
        setNotEnoughFundsForGas(true)
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
          return <Collectible paymentToken={props.paymentToken} address={address} pricePerToken={order.pricePerToken} tokenID={order.tokenId} network={props.network} contractAddress={props.contractAddress} callToAction={'Purchase Instant'} onClick={() => onAcceptOrder(order.orderId, order.pricePerToken)}/>
        })
        setMarketSellOrders(orders)
    }
    useEffect(() => {
      if(view == 2||view == 0){
        getTopOrders()
      }
    }, [view])

    const getUserBalance = async () => {
      const indexer = new SequenceIndexer(`https://${props.network}-indexer.sequence.app`, 'AQAAAAAAAF_JvPALhBthL7VGn6jV0YDqaFY')
  
      // try any contract and account address you'd like :)
      const contractAddress = props.contractAddress
      const accountAddress = address
      
      // query Sequence Indexer for all nft balances of the account on Polygon
      const nftBalances = await indexer.getTokenBalances({
        contractAddress: contractAddress,
        accountAddress: accountAddress,
        includeMetadata: true
      })
      
      let tempUserOwnerBalances: any = []
      nftBalances.balances.map((balance) => {
        if(balance.contractAddress.toLowerCase() == contractAddress.toLowerCase()){
          tempUserOwnerBalances.push(
            <Collectible tokenID={balance.tokenID} network={props.network} contractAddress={props.contractAddress} callToAction={'Sell'} onClick={() => onCreateRequest(balance.tokenID as any)}/>
          )
        }
      })

      setUserOwnedItems(tempUserOwnerBalances)
    }
    const getUserBalanceForOrder = async () => {
      const indexer = new SequenceIndexer(`https://${props.network}-indexer.sequence.app`, 'AQAAAAAAAF_JvPALhBthL7VGn6jV0YDqaFY')
  
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

    const getUserPriceBalanceForOrder = async () => {
      const indexer = new SequenceIndexer(`https://${props.network}-indexer.sequence.app`, 'AQAAAAAAAF_JvPALhBthL7VGn6jV0YDqaFY')
  
      // try any contract and account address you'd like :)
      const contractAddress = props.paymentToken
      const accountAddress = address
      
      // query Sequence Indexer for all nft balances of the account on Polygon
      const nftBalances: any = await indexer.getTokenBalances({
        contractAddress: contractAddress,
        accountAddress: accountAddress,
      })
      
      nftBalances.balances.map((balance: any) => {
        if(balance.contractAddress.toLowerCase() == contractAddress.toLowerCase() && Number(ethers.utils.parseUnits(balance.balance, paymentTokenDecimal).toString()) > Number(price)){
          // setNotEnoughFundsForGas(true)
        } else {
          // setNotEnoughFundsForGas(false)
        }
      })
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
      if(view){
        observeAppRoot2()
      }
    },[])

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
    }, [quantity])

    useEffect(() => {
      getUserPriceBalanceForOrder()
    }, [price])

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
                      const parser = new DOMParser();
                      const doc = parser.parseFromString(evt.target.innerHTML, 'text/html');
                      
                      // Select the element and get its inner content
                      const element: any = doc.querySelector('span.fyvr11mv.fyvr11eg.fyvr11g0.fyvr11fs.fyvr11fc._1qxj1ib9');
                      
                      if(element){
                        const innerContent = element.innerHTML.trim(); 
                      switch(innerContent){
                        case 'Sell':
                          setView(2)
                          break;
                        case 'Market':
                          setView(0)
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
                                  <span style={{color:'blueviolet'}}>Not enough gas to pay for transaction</span>
                                </>
                              : 
                                <div className="scrollable-container">
                                  {marketSellOrders.length == 0 ? (
                                  <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        
                                  <div style={{display: 'flex', justifyContent: 'center', width: '600px'}}>
                                  <h2 style={{width: '100%', textAlign: 'center'}}>There are no orders</h2>
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
                              view == 3 
                              ? 
                                <>
                                  {/* <Button label="Back" onClick={() => setView(0)}></Button> */}
                                  <br/>
                                  <Card>
                                  Token ID: {inProgressSaleTokenID}, selling for {paymentTokenName}
                                  <br/>
                                  <br/>
                                  <TextInput placeholder="price" onChange={(evt: any) => setPrice(evt.target.value)}></TextInput>
                                  <br/>
                                  <TextInput placeholder="quantity" onChange={(evt: any) => setQuantity(evt.target.value)}></TextInput>
                                  <br/>
                                  <div>
                                    <label>Expiry</label>
                                    <input
                                      type="datetime-local"
                                      onChange={(e) => {
                                        const inputDate = new Date(e.target.value);
                                        const timestamp = inputDate.getTime(); // This will give you the timestamp in milliseconds
                                        setDateTime(timestamp);
                                      }}
                                      // @ts-ignore
                                      style={styles.inputDate}
                                    />
                                  </div>
                                  <br/>
                                  <div>
                                    <Button onClick={() => createSellRequest(inProgressSaleTokenID)} disabled={price === 0 || quantity === 0 || !dateTime || !hasSufficientToken} label="Create Sell Order"></Button>
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
                                        <h2 style={{width: '100%', textAlign: 'center'}}>There are no owned items</h2>
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
                              <p>Address: {`${address}`}</p>
                              <p>Network: {`${props.network}`}</p>
                              <br/>
                              <p>{tokenName} Balance: {tokenBalance}</p>
                              <p>{`ETH Balance: ${nativeBalance}`}</p>
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
                                        <h2 style={{width: '100%', textAlign: 'center'}}>There are no mintable items</h2>
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

export default MarketplaceWidget
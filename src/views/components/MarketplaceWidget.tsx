import {useEffect, useState} from 'react'
import { Modal, Box, Button, Text, TextInput, Tabs, Card } from "@0xsequence/design-system";
import Collectible from "./Collectible";
import { AnimatePresence } from "framer-motion";
import { useAccount } from 'wagmi';
import { useAddFundsModal } from '@0xsequence/kit-checkout'
import { SequenceIndexer } from '@0xsequence/indexer'

const MarketplaceWidget = (props: any) => {
  const {address} = useAccount()
  const [isOpen, toggleModal] = useState(false);
  const [view, setView] = useState(0)
  const [count, setCount] = useState(0)
  const { triggerAddFunds: toggleAddFunds } = useAddFundsModal()
  const [tokenBalance, setTokenBalance] = useState(0)
  const [tokenName, setTokenName] = useState('')
  const [inProgressSaleTokenID, setInProgressSaleTokenID] = useState(0)
  const [paymentTokenName, setPaymentTokenName] = useState('')

  const [price, setPrice] = useState(0)
  const [quantity, setQuantity] = useState(0)
  const [hasSufficientToken, setHasSufficientToken] = useState(true)

  const wait = (ms: any) => new Promise((res) => setTimeout(res,ms))
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
  };
  const onClick = () => {
    (document.getElementsByClassName('_5b32m91 _5b32m90 fyvr11jg fyvr11ko fyvr11h0 fyvr11hs fyvr11nk fyvr1ko fyvr1oo fyvr1qo fyvr1mo')[0] as any).style!.zIndex = 0;

    toggleAddFunds({
      walletAddress: address!,
    })

    
  
    observeAppRoot();
    // execute this line when appRoot appears
    // document.getElementById('appRoot')!.style!.scale! = '0.8'
  }

  const onMintClick = async (tokenID: number) => {
    console.log(address)
      try {
        const response = await fetch('http://localhost:8787/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // If you need to send an authorization token, you can add it here:
            // 'Authorization': 'Bearer your-token-here'
          },
          body: JSON.stringify({ address, tokenID }) // Pass the tokenID in the body
        });
    
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
    
        // const data = await response.json();
        // console.log('Response data:', data);
        setCount(count+1)
        // return data;
      } catch (error) {
        console.error('Error performing POST request:', error);
        throw error;

      }
  }
    const onAcceptOrder = () => {
      setView(1)
    }
    const getERC20Balance = async () => {
      const indexer = new SequenceIndexer(`https://${props.network}-indexer.sequence.app`, 'AQAAAAAAAF_JvPALhBthL7VGn6jV0YDqaFY')
  
      // try any contract and account address you'd like :)
      const contractAddress = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'
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
            contractAddresses: ['0xaf88d065e77c8cC2239327C5EDb3A432268e5831'],
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
      setView(3)
    }

    const createSellRequest = () => {
      const obj = {
        price: price,
        quantity: quantity
      }

      console.log(obj)
    }

    return(
        <>      
        <Button onClick={() => {
            toggleModal(true)
          }} 
          label='Open Marketplace'/>
        <AnimatePresence>
        {isOpen && (
          <Modal onClose={() => toggleModal(false)}>
            <Box
              flexDirection="column"
              justifyContent="space-between"
              height="full"
              padding="16"
            >
              {
                <Tabs
                style={{outline: 'none'}}
                onClick={(evt: any) => {
                  console.log(evt.target.innerHTML)
                  // const element = document.querySelector('span.fyvr11mv.fyvr11eg.fyvr11g0.fyvr11fs.fyvr11fc._1qxj1ib9');
                  // const innerContent = element.innerHTML.trim();
                  const parser = new DOMParser();
                  const doc = parser.parseFromString(evt.target.innerHTML, 'text/html');

                  // Select the element and get its inner content
                  const element: any = doc.querySelector('span.fyvr11mv.fyvr11eg.fyvr11g0.fyvr11fs.fyvr11fc._1qxj1ib9');
                  const innerContent = element.innerHTML.trim(); 
                  console.log(innerContent.length)
                  switch(innerContent){
                    case 'Sell':
                      console.log('sell tab')
                      setView(2)
                      break;
                    case 'Market':
                      setView(0)
                      break;
                  }
                }}
    className="navBar"
    defaultValue="Market"
    tabs={['Mint', 'On-ramp', 'Market', 'Sell'].map((category) => {
      return {
        label: `${category}`,
        value: category,
        content: (
          <>
          {category == 'Market' ? 
                view == 1 ? 
                <>
          <br/>
          <Button label="back" onClick={() => setView(0)}></Button>
          go back a step</>
          : 
            <div className="scrollable-container">
              <Collectible tokenID={0} network={'arbitrum'} contractAddress={'0xfeeb59a14b6670c4d8f3f314303702d46eb5957f'} callToAction={'Purchase'} onClick={onAcceptOrder}/>
              <Collectible tokenID={1} network={'arbitrum'} contractAddress={'0xfeeb59a14b6670c4d8f3f314303702d46eb5957f'} callToAction={'Purchase'} onClick={onAcceptOrder}/>
              <Collectible tokenID={2} network={'arbitrum'} contractAddress={'0xfeeb59a14b6670c4d8f3f314303702d46eb5957f'} callToAction={'Purchase'} onClick={onAcceptOrder}/>
              <br/>
              <br/>
            </div>
          :
          category == 'Sell' ? 
          view == 3 ? 
          <>
          <br/>
          <Button label="Back" onClick={() => setView(0)}></Button>
          <br/>
          <br/>
          <Card>
          Token ID: {inProgressSaleTokenID}, selling with {paymentTokenName}
          <br/>
          <br/>
          <TextInput placeholder="price" onChange={(evt: any) => setPrice(evt.target.value)}></TextInput>
          <br/>
          <TextInput placeholder="quantity" onChange={(evt: any) => setQuantity(evt.target.value)}></TextInput>
          <br/>
          <div>
            <Button onClick={() => createSellRequest()} disabled={price == 0 && quantity == 0 && hasSufficientToken} label="Create Sell Request"></Button>
            {!hasSufficientToken && <span style={{marginLeft:'147px', color:'red'}}>Insufficent tokens</span>}
          </div>
          </Card>
          </>
          : 
          <>
          <div className="scrollable-container">
            <Collectible tokenID={0} network={'arbitrum'} contractAddress={'0xfeeb59a14b6670c4d8f3f314303702d46eb5957f'} callToAction={'Sell'} onClick={() => onCreateRequest(0)}/>
            <Collectible tokenID={1} network={'arbitrum'} contractAddress={'0xfeeb59a14b6670c4d8f3f314303702d46eb5957f'} callToAction={'Sell'} onClick={() => onCreateRequest(1)}/>
            <Collectible tokenID={2} network={'arbitrum'} contractAddress={'0xfeeb59a14b6670c4d8f3f314303702d46eb5957f'} callToAction={'Sell'} onClick={() => onCreateRequest(2)}/>
            <Collectible tokenID={3} network={'arbitrum'} contractAddress={'0xfeeb59a14b6670c4d8f3f314303702d46eb5957f'} callToAction={'Sell'} onClick={() => onCreateRequest(3)}/>
            <Collectible tokenID={4} network={'arbitrum'} contractAddress={'0xfeeb59a14b6670c4d8f3f314303702d46eb5957f'} callToAction={'Sell'} onClick={() => onCreateRequest(4)}/>
            <Collectible tokenID={5} network={'arbitrum'} contractAddress={'0xfeeb59a14b6670c4d8f3f314303702d46eb5957f'} callToAction={'Sell'} onClick={() => onCreateRequest(5)}/>
            <br/>
            <br/>
          </div>
        </>
          :
          category == 'On-ramp' ?
          <>
          <br/>
          <Card>
          <p>Network: {`${props.network}`}</p>
          <br/>
          <p>{tokenName} Balance: {tokenBalance}</p>
          <br/>
          <Button variant='primary' label={'Add Funds'} onClick={onClick}></Button>
          </Card>
          
          </>
          :
          <>
            <div className="scrollable-container">
              <Collectible tokenID={0} network={'arbitrum'} contractAddress={'0xfeeb59a14b6670c4d8f3f314303702d46eb5957f'} callToAction={'Mint'} onClick={()=> onMintClick(0)} onUpdateCount={count}/>
              <Collectible tokenID={1} network={'arbitrum'} contractAddress={'0xfeeb59a14b6670c4d8f3f314303702d46eb5957f'} callToAction={'Mint'} onClick={()=> onMintClick(1)} onUpdateCount={count}/>
              <Collectible tokenID={2} network={'arbitrum'} contractAddress={'0xfeeb59a14b6670c4d8f3f314303702d46eb5957f'} callToAction={'Mint'} onClick={()=> onMintClick(2)} onUpdateCount={count}/>
              <Collectible tokenID={3} network={'arbitrum'} contractAddress={'0xfeeb59a14b6670c4d8f3f314303702d46eb5957f'} callToAction={'Mint'} onClick={()=> onMintClick(3)} onUpdateCount={count}/>
              <Collectible tokenID={4} network={'arbitrum'} contractAddress={'0xfeeb59a14b6670c4d8f3f314303702d46eb5957f'} callToAction={'Mint'} onClick={onMintClick}/>
              <Collectible tokenID={5} network={'arbitrum'} contractAddress={'0xfeeb59a14b6670c4d8f3f314303702d46eb5957f'} callToAction={'Mint'} onClick={onMintClick}/>
              <br/>
              <br/>
            </div>
          </>
                  
        }
          </>
        ),
      };
    })}
  >

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
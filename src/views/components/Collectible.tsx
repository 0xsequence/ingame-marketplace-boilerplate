import React, { useState, useEffect } from "react";
import "./Collectible.css"; // Create this CSS file for styles
import { SequenceIndexer } from '@0xsequence/indexer'
import { useTheme } from "@0xsequence/design-system";

const ImageWindow = (props: any) => {
  const [urlImage, setUrlImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const res = await fetch(`https://metadata.sequence.app/tokens/${props.network}/${props.contractAddress}/${props.tokenID}/`);
        const data = await res.json();
        
        // Assuming the image URL is in a property named 'image'
        const image = data[0]?.image || ''; 
        props.setTokenID(data[0]?.tokenId)
        props.setName(data[0]?.name)
        setUrlImage(image);
      } catch (error) {
        console.error('Error fetching image:', error);
      }
    };

    fetchImage();
  }, [props.network, props.contractAddress, props.tokenID]);

  return (
    <div className="image-window">
      <div className="image-container">
        {urlImage ? (
          <img
            src={urlImage}
            alt="Windowed Image"
            className="image"
          />
        ) : (
          <p>Loading image...</p>
        )}
      </div>
    </div>
  );
};

const ImageCard = (props: any) => {
  const {theme} = useTheme()
  const [isHovered, setIsHovered] = useState(false);
  const [isOpen, _] = useState(false);
  const [inProgress, setInProgress] = useState(false)
  const [tokenID, setTokenID] = useState<any>('...')
  const [name, setName] = useState<any>('...')
  const [supply, setSupply] = useState<any>('...')
  const [maxSupply, setMaxSupply] = useState<any>('...')
  const [insufficentPayment, setInsufficentPayment] = useState<any>(false)
  const [decimals, setDecimals] = useState<any>(0)
  const [paymentTokenName, setPaymentTokenName] = useState<any>('')

  React.useEffect(() => {

  }, [isOpen])

  React.useEffect(() => {
    console.log(props.minterURL)
    if(tokenID!='...'){
      setTimeout(async () => {
        try {
          const res = await fetch(`${props.minterURL}maxSupply/${tokenID}`)
          if(res.status == 200){

          const data = await res.json()
          setMaxSupply(data.supply)
        }
        }catch(err){
          console.log(err)
        }
      }, 0)
    }

    if(tokenID!='...'){
      setTimeout(async () => {
        try {
          const res = await fetch(`${props.minterURL}supply/${tokenID}`)
          if(res.status == 200){

          const data = await res.json()
          setSupply(data.supply)
        }
        }catch(err){
          console.log(err)
        }
      }, 0)
    }
  }, [inProgress, tokenID])

  const getUserBalance = async () => {
    const indexer = new SequenceIndexer(`https://${props.network}-indexer.sequence.app`, import.meta.env.VITE_PROJECT_ACCESS_KEY!)
  
      // try any contract and account address you'd like :)
      const contractAddress = props.paymentToken
      const accountAddress = props.address
      
      // query Sequence Indexer for all nft balances of the account on Polygon
      const nftBalances = await indexer.getTokenBalances({
        contractAddress: contractAddress,
        accountAddress: accountAddress,
        includeMetadata: true
      })
      
      nftBalances.balances.map((balance: any) => {
        if(balance.contractAddress.toLowerCase() == contractAddress.toLowerCase()){
          setDecimals(balance.contractInfo?.decimals)
          setPaymentTokenName(balance.contractInfo.name)
          if((Number(balance.balance)/Number(10**Number(balance.contractInfo?.decimals)) < (Number(props.pricePerToken)/Number(10**Number(balance.contractInfo?.decimals))))){
            setInsufficentPayment(true)
          } 
        }
      })
  }
  useEffect(() => {
    props.address && getUserBalance()
  }, [])

  useEffect(() => {

  }, [maxSupply, props.view, insufficentPayment,supply, name, props.onUpdateCount])

  return (
    <div
      className="image-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
        <ImageWindow setTokenID={setTokenID} setName={setName} network={props.network} tokenID={props.tokenID} contractAddress={props.contractAddress}/>
      <div className="image-text" style={{color: theme == 'light' ? 'black' : 'white'}} >Token ID: #{`${tokenID}`}</div>
      <div className="image-text" style={{ color: theme === 'light' ? 'black' : 'white' }}>
        {name.length > 25 ? `${name.slice(0, 25)}...` : name}
      </div>
      <div className={`overlay hovered`} style={{marginTop: '-20px',textAlign: 'right', paddingRight: props.callToAction=='Purchase Instant' ? '0px':'20px'}}>
        {props.callToAction=='Purchase Instant' && <span style={{color: theme == 'light' ? 'black' : 'white'}}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{Number(props.pricePerToken)/Number(10**Number(decimals))} {paymentTokenName}</span>}
        <span style={{color: theme == 'light' ? 'black' : 'white'}}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{props.callToAction=='Mint Instant' && `${supply}/${maxSupply}`}</span>
        {props.balance && <span style={{color: theme == 'light' ? 'black' : 'white'}}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{props.balance}x</span>}
      </div>
      <div className="offer-text" style={{display: isHovered ? '': 'none'}} onClick={async () => {
        if(!inProgress&&!insufficentPayment && props.callToAction != 'Server Error'){
          setInProgress(true)
          console.log()
          console.log(props.onClick)
          await props.onClick(props.tokenID)
          setInProgress(false)
        }
      }}>
          {
            !inProgress 
          ? 
              insufficentPayment
            ?
              'Insufficient Payment Balance'
            :
              props.callToAction 
          : 
            "Loading..."}
          </div>
    </div>
  );
};

export default ImageCard;

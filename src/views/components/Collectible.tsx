import React, { useState, useEffect } from "react";
import "./Collectible.css"; // Create this CSS file for styles

import { Modal, Box, Button, Text, TextInput, Tabs } from'@0xsequence/design-system'
import { AnimatePresence } from "framer-motion";
import SequenceMarketABI from '../../abi/ISequenceMarketplace.json'
import {
  useCheckoutModal,
  useCheckoutWhitelistStatus,
} from '@0xsequence/kit-checkout';

import {ethers} from 'ethers'


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
  const [isHovered, setIsHovered] = useState(false);
  const [isOpen, toggleModal] = useState(false);
  const { triggerCheckout } = useCheckoutModal();
  const [inProgress, setInProgress] = useState(false)
  const [tokenID, setTokenID] = useState<any>('...')
  const [name, setName] = useState<any>('...')
  const [supply, setSupply] = useState<any>('...')
  const [maxSupply, setMaxSupply] = useState<any>('...')
  React.useEffect(() => {

  }, [isOpen])

  const SEQUENCE_MARKET_V1_ADDRESS =
  '0xB537a160472183f2150d42EB1c3DD6684A55f74c';

  const isDev = true


  const acceptRequest = () => {
    // console.log()
    const calldata = ''

    const sequenceMarketInterface = new ethers.utils.Interface(
      SequenceMarketABI.abi,
    );
    const data = sequenceMarketInterface.encodeFunctionData(
      "acceptRequest",
      [100, 1, '0xBAbebe9FE973a5735D486BF6D31e9a027248024e', [], []],
    );

    const checkoutSettings = {
      creditCardCheckout: {
        chainId: 421614,
        contractAddress: SEQUENCE_MARKET_V1_ADDRESS,
        recipientAddress: '0xBAbebe9FE973a5735D486BF6D31e9a027248024e'!,
        currencyQuantity: '1',
        currencySymbol: 'WETH',
        currencyAddress: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
        currencyDecimals: '18',
        nftId: '8' || '',
        nftAddress: '0x9bec34c1f7098e278afd48fedcf13355b854364a' || '',
        nftQuantity: '1',
        nftDecimals: '2',
        calldata: calldata,
        approvedSpenderAddress: SEQUENCE_MARKET_V1_ADDRESS,
        isDev,
        onSuccess: (txnHash: any) => {
          console.log(txnHash)
          // onCreditCardSuccesss(txnHash).catch((e) => console.error(e));
        },
        onError: (error: any) => {
          console.error(error);
        },
      },
    };

    triggerCheckout(checkoutSettings);
  }

  React.useEffect(() => {
    console.log(props.onUpdateCount)
    if(tokenID){
      setTimeout(async () => {
        const res = await fetch(`http://localhost:8787/maxSupply/${tokenID}`)
        // console.log(res)
        const data = await res.json()
        // console.log(data)
        setMaxSupply(data.supply)
      }, 0)
    }

    if(tokenID){
      setTimeout(async () => {
        const res = await fetch(`http://localhost:8787/supply/${tokenID}`)
        // console.log(res)
        const data = await res.json()
        // console.log(data)
        setSupply(data.supply)
      }, 0)
    }
  }, [inProgress, tokenID])

  useEffect(() => {

  }, [maxSupply, supply, name, props.onUpdateCount])

  return (
    <div
      className="image-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
        <ImageWindow setTokenID={setTokenID} setName={setName} network={props.network} tokenID={props.tokenID} contractAddress={props.contractAddress}/>
      <div className="image-text" >Token ID: #{`${tokenID}`}</div>
      <div className="image-text" >{name}</div>
      <div className={`overlay hovered`} style={{marginTop: '-20px',textAlign: 'right', paddingRight: '20px'}}>
        <span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{props.callToAction=='Mint' && `${supply}/${maxSupply}`}</span>
      </div>
      <div className="offer-text" style={{display: isHovered ? '': 'none'}} onClick={async () => {
        // toggleModal(true);
        setInProgress(true)
        await props.onClick()

        setInProgress(false)
        // acceptRequest();

        // setTimeout(() => {
        // toggleModal(false);

          // (document.getElementsByClassName('_5b32m91 _5b32m90 fyvr11jg fyvr11ko fyvr11h0 fyvr11hs fyvr11nk fyvr1ko fyvr1oo fyvr1qo fyvr1mo')[1]! as any).style!.zIndex = -10;
        //   (document.getElementsByClassName('_5b32m91 _5b32m90 fyvr11jg fyvr11ko fyvr11h0 fyvr11hs fyvr11nk fyvr1ko fyvr1oo fyvr1qo fyvr1mo')[0]! as any).style!.zIndex = 1;
        //   (document.getElementsByClassName('_5b32m95 _5b32m94 fyvr11d8 fyvr11dw fyvr11bg fyvr11by fyvr11c4 fyvr11cm fyvr11ls fyvr11m8 fyvr12ws fyvr12wm fyvr11h0 fyvr11i4 fyvr11hs fyvr11sd fyvr1mo fyvr1om _5b32m97')[0]! as any).style!.zIndex = 2000;
        //   // (document.getElementsByClassName('_5b32m91 _5b32m90 fyvr11jg fyvr11ko fyvr11h0 fyvr11hs fyvr11nk fyvr1ko fyvr1oo fyvr1qo fyvr1mo')[0]! as any).remove()
        //   (document.getElementById('radix-:rd:') as any).style.zIndex = -1
        // }, 1000)

        }}>{!inProgress ? props.callToAction : "Loading..."}</div>
    </div>
  );
};

export default ImageCard;

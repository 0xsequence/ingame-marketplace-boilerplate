import { useAccount } from "wagmi";
import { useState, useEffect } from 'react'
import "./Home.css";
import NotConnected from "./components/blockchain/NotConnected";
import {Button, Text, Box } from "@0xsequence/design-system";
import Connected from "./components/blockchain/Connected";
import MarketplaceOverlay from './components/MarketplaceOverlay'
import { useTheme } from "@0xsequence/design-system";
import Collectible from './components/Collectible'

const minterURL = 'https://p2p-marketplace-overlay.tpin.workers.dev/'

const Home = () => {
  const [isOpen, toggleModal] = useState<boolean>(false);

  const [count, setCount] = useState(0)

  const { isConnected, address } = useAccount();
  const { setTheme, theme } = useTheme();
  const [mintableCollectibles, setMintableCollectible] = useState<any>([])

  useEffect(() => {
    setTheme('dark')
    populateMintableCollectibles({
      contractAddress: '0xfeeb59a14b6670c4d8f3f314303702d46eb5957f',
      network: 'arbitrum',
      tokenIDs: ['0','1','2','3','4','5',]})
  }, [isOpen])

  const onMintClick = async (tokenID: number) => {
      try {
        const response = await fetch(minterURL, {
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

  const populateMintableCollectibles = async (props: any) => {
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
                minterURL={minterURL}
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

  return (
    <div>
      <h1>Sequence Marketplace Overlay Boilerplate</h1>
      <h2 className="homepage__marginBtNormal">Embedded Wallet</h2>
      {isConnected ? <Connected /> : <NotConnected />}
      <br/>
      <br/>
      {isConnected && <Button onClick={() => toggleModal(true)} label='Open Marketplace Overlay'/>}
      {isConnected &&
          <MarketplaceOverlay
          // primaryBackgroundColor={'blue'}
          // secondaryCardColor={'red'}
          isOpen={isOpen}
          toggleModal={toggleModal}
          tokenIDs={['0','1','2','3','4','5']}
          paymentToken={'0xaf88d065e77c8cC2239327C5EDb3A432268e5831'}
          contractAddress={'0xfeeb59a14b6670c4d8f3f314303702d46eb5957f'}
          network={'arbitrum'}
          />
      }
      <br/>
      <br/>
      <br/>
      {
        isConnected 
        && 
        <div
              style={{ 
                borderRadius: '30px',
                  background: 'black',
                  width: '100%', 
                  height: '100vh', // Full viewport height 
                  display: 'flex', // Flexbox to align items
                  justifyContent: 'center', // Center horizontally
                  alignItems: 'center', // Center vertically
                  margin: 'auto'
              }}
          >
            <div className="scrollable-container">
              {mintableCollectibles.length === 0 ? (
                <div 
                  style={{ 
                    textAlign: 'center', 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    height: '100%' 
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'center', width: '600px' }}>
                    <h2 style={{ color: theme === 'light' ? 'black' : '', width: '100%', textAlign: 'center' }}>
                      There are no mintable items
                    </h2>
                  </div>
                </div>
              ) : (
                <>{mintableCollectibles}</>
              )}
              <br />
              <br />
            </div>
          </div>

      }
      <footer className="homepage__footer">
        <Text>
          Want to learn more? Read the{" "}
          <a
            href={
              "https://docs.sequence.xyz/solutions/wallets/sequence-kit/overview/"
            }
            target="_blank"
            rel="noreferrer "
          >
            docs
          </a>
          !
        </Text>
      </footer>

    </div>
  );
};

export default Home;

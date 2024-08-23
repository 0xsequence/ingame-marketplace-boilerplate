import { useAccount } from "wagmi";
import { useState, useEffect } from 'react'
import "./Home.css";
import NotConnected from "./components/blockchain/NotConnected";
import { Modal, Box, Button, Text, TextInput, Tabs } from "@0xsequence/design-system";
import Connected from "./components/blockchain/Connected";
import MarketplaceWidget from './components/MarketplaceWidget'
// import {CollectibleTradeActions} from './components/ModalOrderCreaction'
const Home = () => {
  const { isConnected } = useAccount();
  const [isOpen, toggleModal] = useState(false);
  const [view, setView] = useState(0)


  useEffect(() => {

  }, [view])


  return (
    <div>
      <h1>Sequence Marketplace Widget Boilerplate</h1>
      <h2 className="homepage__marginBtNormal">Embedded Wallet</h2>
      {isConnected ? <Connected /> : <NotConnected />}
      <br/>
      <br/>
      {/* <CollectibleTradeActions
            chainId={1}
            collectionAddress={'0x4279aa50a32b8c892206f4ef1a25befb6fd33922'}
            tokenId={'0'}
          /> */}
          <MarketplaceWidget 
          paymentToken={'0xaf88d065e77c8cC2239327C5EDb3A432268e5831'}
          contractAddress={'0xfeeb59a14b6670c4d8f3f314303702d46eb5957f'}
          network={'arbitrum'}/>
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

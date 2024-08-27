import { useAccount } from "wagmi";
import { useState, useEffect } from 'react'
import "./Home.css";
import NotConnected from "./components/blockchain/NotConnected";
import {Button, Text} from "@0xsequence/design-system";
import Connected from "./components/blockchain/Connected";
import MarketplaceWidget from './components/MarketplaceWidget'

const Home = () => {
  const [isOpen, toggleModal] = useState<boolean>(false);

  const { isConnected } = useAccount();

  useEffect(() => {
  }, [isOpen])

  return (
    <div>
      <h1>Sequence Marketplace Widget Boilerplate</h1>
      <h2 className="homepage__marginBtNormal">Embedded Wallet</h2>
      {isConnected ? <Connected /> : <NotConnected />}
      <br/>
      <br/>
      <Button onClick={() => toggleModal(true)} label='Open Marketplace'/>
      {isConnected &&
          <MarketplaceWidget
          hasMint={true}
          isOpen={isOpen}
          toggleModal={toggleModal}
          tokenIDs={['0','1','2','3','4','5']}
          paymentToken={'0xaf88d065e77c8cC2239327C5EDb3A432268e5831'}
          contractAddress={'0xfeeb59a14b6670c4d8f3f314303702d46eb5957f'}
          network={'arbitrum'}
          minterURL={'https://p2p-marketplace-widget.tpin.workers.dev/'}
          />
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

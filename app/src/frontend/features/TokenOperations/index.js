import { useState, useEffect, useCallback } from 'react';
import { Button, Divider, Grid, Typography, useTheme, TextField } from '@mui/material';
import { localProvider } from '../../components/Wallet';
import { ethers } from 'ethers';
import TokenABI from '../../contracts/SimpleDeFiToken.json';
import TokenAddress from '../../contracts/SimpleDeFiToken-address.json';
import { useWeb3React } from "@web3-react/core";
import { toast } from 'react-toastify';
import {QrReader} from 'react-qr-reader';
import {Connection, PublicKey} from "@solana/web3.js";

import { HttpProvider } from 'web3-providers-http';
import { Box } from '@mui/material';
import { Web3 } from 'web3';
import { decode } from 'bs58';
import { Account, TransactionConfig } from 'web3-core';

import {
  NEON_TOKEN_MINT_DECIMALS,
  NEON_TRANSFER_CONTRACT_DEVNET,
  solanaNEONTransferTransaction,
  SPLToken,
  NeonProxyRpcApi,
  neonNeonTransactionWeb3,
} from '@neonevm/token-transfer';

const TokenOperations = () => {
  const theme = useTheme();
  const { active, account, library } = useWeb3React();
  const [yourBalance, setYourBalance] = useState(0);
  const [showReader, setShowReader] = useState(true);

  const getYourBalance = useCallback(async () => {
    if (!active)
      return;
    try {
      let contract = new ethers.Contract(TokenAddress.address, TokenABI.abi, library.getSigner());
      const response = await contract.balanceOf(account);
      setYourBalance(ethers.utils.formatEther(response));
    } catch (error) {
      console.error('Cannot get your balance', error);
    }
  }, [account, library, active]);

  const handleScan = (data) => {
    if (data) {
      console.log('QR code data:', data);
      setShowReader(false);
      send(data)
    }
  };

  const handleError = (err) => {
    console.error(err);
  };

  const networkUrls = [{
    id: 245022926,
    token: 'NEON',
    solana: 'https://api.devnet.solana.com',
    neonProxy: 'https://devnet.neonevm.org'
  }, {
    id: 245022927,
    token: 'SOL',
    solana: 'https://api.devnet.solana.com',
    neonProxy: 'https://devnet.neonevm.org/solana/sol'
  }];

  async function sendNeonTransaction(web3: Web3, transaction: TransactionConfig, account: Account): Promise<string> {
    // @ts-ignore
    const signedTrx = await web3.eth.accounts.signTransaction(transaction, account.privateKey);
    return new Promise((resolve, reject) => {
      if (signedTrx?.rawTransaction) {
        // @ts-ignore
        web3.eth.sendSignedTransaction(signedTrx.rawTransaction, (error, hash) => {
          if (error) {
            reject(error);
          } else {
            resolve(hash);
          }
        });
      } else {
        reject('Unknown transaction');
      }
    });
  }

  const getDetailsFromUri = (uriString) => {
    const urlParts = new URL(uriString);

    const address = urlParts.host;
    const queryParams = new URLSearchParams(urlParts.query);

    const amount = queryParams.get('amount');
    const token = queryParams.get('spl-token');

    return { address, amount, token };
  }

  const send = async (uriString) => {
    const proxyUrl = `https://devnet.neonevm.org`;
    const solanaUrl = `https://api.devnet.solana.com`;

    const connection = new Connection(solanaUrl, 'confirmed');
    const web3 = new Web3(new HttpProvider(proxyUrl));

    const neonWallet = account

    const neonProxyRpcApi = new NeonProxyRpcApi(proxyUrl);
    const evmParams = await neonProxyRpcApi.evmParams();
    const nativeTokenList = await neonProxyRpcApi.nativeTokenList();

    const id = nativeTokenList.findIndex(i => i.token_name === 'NEON');
    const gasToken = nativeTokenList[id];

    const neonEvmProgram = new PublicKey(evmParams.NEON_EVM_ID);
    const neonTokenMint = new PublicKey(gasToken.token_mint);
    const chainId = parseInt(gasToken.token_chain_id, 16);

    const neonToken: SPLToken = {
      chainId,
      address_spl: '89dre8rZjLNft7HoupGiyxu3MNftR577ZYu8bHe2kK7g',
      address: '',
      decimals: NEON_TOKEN_MINT_DECIMALS,
      name: 'Neon',
      symbol: 'NEON',
      logoURI: 'https://raw.githubusercontent.com/neonlabsorg/token-list/main/neon_token_md.png'
    };

    console.log("yepx")

    let s, am, t = getDetailsFromUri(uriString)

// @ts-ignore
    const transaction = await neonNeonTransactionWeb3(web3, neonWallet.address, NEON_TRANSFER_CONTRACT_DEVNET,a , am);
    const signature = await sendNeonTransaction(web3, transaction, neonWallet);
    console.log(signature);

    showFinalMessage(true)
  }

  const [showFinalMessage, setShowFinalMessage] = useState(false);

  useEffect(() => {
    getYourBalance();
  }, [getYourBalance]);

  let message;

  if(showReader){
    message = <QrReader delay={300} onError={handleError} onResult={handleScan} style={{ width: '100%', height: '100%' }} />;
  }
  else if(!showReader && !showFinalMessage){
    message = <Typography variant="h6" align="center">Sending...</Typography>;
  }
  else{
    message = <Typography variant="h6" align="center">Sent to this address: {message}</Typography>;
  }

  return (
      <Box style={{width: "100vw", height: "100vh"}}>
        { !showReader ?
            message
            :
            <Grid container direction="column" justifyContent="center" alignItems="center" style={{ minHeight: '100vh' }}>
              <Button variant="contained" color="primary" onClick={() => setShowReader(true)}>SCAN</Button>
            </Grid>
        }
      </Box>
  );
};

export default TokenOperations;

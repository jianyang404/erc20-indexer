import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Image,
  Input,
  SimpleGrid,
  Text,
  Spinner,
} from "@chakra-ui/react";
import { Alchemy, Network, Utils } from "alchemy-sdk";
import { useState, useEffect } from "react";

function App() {
  const [isRequestingAccount, setIsRequestingAccount] = useState();
  const [isRequestingBalance, setIsRequestingBalance] = useState();
  const [userAddress, setUserAddress] = useState("");
  const [account, setAccount] = useState("");
  const [results, setResults] = useState({});
  const [hasQueried, setHasQueried] = useState(false);
  const [tokenDataObjects, setTokenDataObjects] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const getAccounts = async () => {
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });

      setAccount(accounts[0]);
      setUserAddress(accounts[0]);
    };

    getAccounts();
  }, []);

  const handleChange = (e) => {
    e.preventDefault();

    setErrorMessage("");
    setResults({});
    setTokenDataObjects([]);
    setHasQueried(false);

    setUserAddress(e.target.value);
  };

  const handleConnect = async () => {
    try {
      if (typeof window.ethereum == "undefined") {
        throw new Error("No wallet installed!");
      }

      setIsRequestingAccount(true);

      const address = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (address) {
        setUserAddress(address);
      }
    } catch (err) {
      console.log(err);

      setErrorMessage(err.reason);
    } finally {
      setIsRequestingAccount(false);
    }
  };

  const getTokenBalance = async () => {
    try {
      const config = {
        apiKey: import.meta.env.REACT_APP_SEPOLIA_API_KEY,
        network: Network.ETH_SEPOLIA,
      };

      const alchemy = new Alchemy(config);

      setIsRequestingBalance(true);

      const data = await alchemy.core.getTokenBalances(userAddress);

      const tokenDataResult = [];

      for await (const token of data.tokenBalances) {
        const tokenData = await alchemy.core.getTokenMetadata(
          token.contractAddress
        );

        tokenDataResult.push(tokenData);
      }

      setResults(data);
      setTokenDataObjects(tokenDataResult);
      setHasQueried(true);
    } catch (err) {
      console.log(err);

      setErrorMessage(err.reason);
    } finally {
      setIsRequestingBalance(false);
    }
  };

  return (
    <Flex w="100vw" h="100vh" p="40px" direction="column" justify="center">
      <Flex justify="end">
        <Button onClick={handleConnect} disabled={isRequestingAccount}>
          {account ? "Connected" : "Connect"}
        </Button>
      </Flex>

      <Flex h="100%" justify="center" align="center" direction="column">
        <Center>
          <Flex
            alignItems={"center"}
            justifyContent="center"
            flexDirection={"column"}
          >
            <Heading mb={0} fontSize={36}>
              ERC-20 Token Indexer
            </Heading>
            <Text>
              Plug in an address and this website will return all of its ERC-20
              token balances!
            </Text>
          </Flex>
        </Center>

        <Flex
          w="100%"
          flexDirection="column"
          alignItems="center"
          justifyContent={"center"}
        >
          <Heading mt={42}>
            Get all the ERC-20 token balances of this address:
          </Heading>
          <Input
            onChange={handleChange}
            value={userAddress}
            color="black"
            w="600px"
            textAlign="center"
            p={12}
            bgColor="white"
            fontSize={16}
            borderRadius={12}
          />
          {errorMessage && <Text color="red">{errorMessage}</Text>}
          <Button fontSize={20} onClick={getTokenBalance} mt={36}>
            Check ERC-20 Token Balances
          </Button>

          <Heading my={36}>ERC-20 token balances:</Heading>

          {isRequestingBalance ? (
            <Spinner w={20} h={20} />
          ) : hasQueried ? (
            <SimpleGrid w={"90vw"} columns={4} spacing={24}>
              {(results.tokenBalances ?? []).map((e, i) => {
                return (
                  <Flex
                    flexDir={"column"}
                    color="white"
                    bg="#1a1a1a"
                    p={16}
                    borderRadius={12}
                    w={"20vw"}
                    key={e.id}
                  >
                    <Box>
                      <b>Symbol:</b> ${tokenDataObjects[i].symbol}&nbsp;
                    </Box>
                    <Box>
                      <b>Balance:</b>&nbsp;
                      {Utils.formatUnits(
                        e.tokenBalance,
                        tokenDataObjects[i].decimals
                      )}
                    </Box>
                    <Image src={tokenDataObjects[i].logo} />
                  </Flex>
                );
              })}
            </SimpleGrid>
          ) : (
            "Please make a query! This may take a few seconds..."
          )}
        </Flex>
      </Flex>
    </Flex>
  );
}

export default App;

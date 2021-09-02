import { useState, useEffect } from "react";
import {
  Button,
  useColorMode,
  Flex,
  Heading,
  Spacer,
  Container,
  FormControl,
  FormLabel,
  InputGroup,
  Input,
  Center,
  useToast,
  Image,
} from "@chakra-ui/react";
import { SunIcon, MoonIcon } from "@chakra-ui/icons";
import ConnectWallet from "./components/ConnectWallet";
import { Contract, ethers } from "ethers";
import { Web3Provider } from "./types";
import Footer from "./components/Footer";

function App() {
  const { colorMode, toggleColorMode } = useColorMode();
  const underlineColor = { light: "gray.500", dark: "gray.400" };
  const bgColor = { light: "white", dark: "gray.700" };
  const toast = useToast();

  const [provider, setProvider] = useState<Web3Provider>();
  const [showAddress, setShowAddress] = useState(""); // gets displayed in input. ENS name remains as it is
  const [isAddressValid, setIsAddressValid] = useState(true);

  const [contract, setContract] = useState<Contract>();
  const [loading, setLoading] = useState<boolean>(false);
  const [image, setImage] = useState<string>();

  const syntheticLootAddress = "0x869Ad3Dfb0F9ACB9094BA85228008981BE6DBddE";
  const syntheticLootABI = require("./abi/SyntheticLoot.json");

  useEffect(() => {
    if (provider) {
      setContract(
        new ethers.Contract(syntheticLootAddress, syntheticLootABI, provider)
      );
    }
  }, [provider]);

  const resolveAndValidateAddress = async () => {
    let isValid;
    let _address = showAddress;
    if (!showAddress) {
      isValid = false;
    } else {
      try {
        // Resolve ENS
        const resolvedAddress = await provider!.resolveName(showAddress);
        if (resolvedAddress) {
          _address = resolvedAddress;
          isValid = true;
        } else if (ethers.utils.isAddress(showAddress)) {
          _address = showAddress;
          isValid = true;
        } else {
          isValid = false;
        }
      } catch {
        isValid = false;
      }
    }

    setIsAddressValid(isValid);
    if (!isValid) {
      toast({
        title: "Invalid Address",
        description: "Address is not an ENS or Ethereum address",
        status: "error",
        isClosable: true,
        duration: 4000,
      });
    }

    return { isValid, _address: _address };
  };

  const fetchImage = async () => {
    setLoading(true);
    const { isValid, _address } = await resolveAndValidateAddress();

    if (isValid) {
      const tokenURI = await contract!.tokenURI(_address);
      // 29 = length of "data:application/json;base64,"
      const jsonString = Buffer.from(tokenURI.substring(29), "base64").toString(
        "binary"
      );
      const json = JSON.parse(jsonString);
      setImage(json.image);
    }

    setLoading(false);
  };

  return (
    <>
      <Flex
        py="4"
        px={["2", "4", "10", "10"]}
        borderBottom="2px"
        borderBottomColor={underlineColor[colorMode]}
      >
        <Spacer flex="1" />
        <Heading maxW={["302px", "4xl", "4xl", "4xl"]}>
          Synthetic Loot Explorer 🔍
        </Heading>
        <Flex flex="1" justifyContent="flex-end">
          <Button onClick={toggleColorMode} rounded="full" h="40px" w="40px">
            {colorMode === "light" ? <MoonIcon /> : <SunIcon />}
          </Button>
        </Flex>
      </Flex>
      <Container my="16" minH="md" minW={["0", "0", "2xl", "2xl"]}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchImage();
          }}
        >
          <FormControl>
            <FormLabel>
              Enter Address or ENS to view its Synthetic Loot
            </FormLabel>
            <InputGroup>
              <Input
                placeholder="Address"
                aria-label="address"
                autoComplete="off"
                value={showAddress}
                onChange={(e) => {
                  const _showAddress = e.target.value;
                  setShowAddress(_showAddress);
                  setIsAddressValid(true); // remove inValid warning when user types again
                }}
                bg={bgColor[colorMode]}
                isInvalid={!isAddressValid}
                isDisabled={!provider}
              />
            </InputGroup>
          </FormControl>
          {provider && (
            <Center>
              <Button isLoading={loading} mt="1rem" type="submit">
                View
              </Button>
            </Center>
          )}
        </form>
        <Center>
          {provider ? (
            <Image pt="0.5rem" w="30rem" src={image} />
          ) : (
            <ConnectWallet mt="10rem" setProvider={setProvider} />
          )}
        </Center>
      </Container>
      <Footer />
    </>
  );
}

export default App;

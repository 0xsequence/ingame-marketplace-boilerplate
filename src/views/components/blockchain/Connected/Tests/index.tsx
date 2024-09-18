import { Box } from "@0xsequence/design-system";

const Tests = (props: { chainId: number }) => {
  // @ts-ignore
  const { chainId } = props;
  return (
    <Box display="flex" flexDirection="column" gap="4">
      {/* <TestSignMessage /> */}
      {/* <TestVerifyMessage chainId={chainId} /> */}
      {/* <TestSendTransaction /> */}
    </Box>
  );
};

export default Tests;

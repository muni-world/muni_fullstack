import { FC } from "react";
import { getFunctions, httpsCallable, HttpsCallableResult } from "firebase/functions";

// Define the expected response type
interface HelloWorldResponse {
  message: string;
}

const ExampleComponent: FC = () => {
  const functions = getFunctions();
  const helloWorld = httpsCallable<void, HelloWorldResponse>(
    functions, 
    "helloWorld",
  );

  const handleClick = async (): Promise<void> => {
    try {
      const result: HttpsCallableResult<HelloWorldResponse> = await helloWorld();
      console.log(result.data.message);
    }
    catch (error) {
      console.error("Error calling function:", error);
    }
  };

  return (
    <button onClick={handleClick}>Call Function</button>
  );
};

export default ExampleComponent; 
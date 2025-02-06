import { getFunctions, httpsCallable } from "firebase/functions";

function ExampleComponent() {
  const functions = getFunctions();
  const helloWorld = httpsCallable(functions, "helloWorld");

  const handleClick = async () => {
    try {
      const result = await helloWorld();
      console.log(result.data.message);
    }
    catch (error) {
      console.error("Error calling function:", error);
    }
  };

  return (
    <button onClick={handleClick}>Call Function</button>
  );
}

export default ExampleComponent; 
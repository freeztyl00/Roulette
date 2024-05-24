import { StrictMode } from "react";
import { useInputState } from "@mantine/hooks";
import { Button, TextInput } from "@mantine/core";
import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import RouletteWrapper from "./RouletteWrapper";
import "./styles.css";

const rootElement = document.getElementById("app") as HTMLElement;
const root = createRoot(rootElement);
console.log(555);

function App() {
  const [stringValue, setStringValue] = useState("");
  const [usernameValue, setUsernameValue] = useState("");
  const [error, setError] = useState(false);

  if (usernameValue === "") {
    return (
      <>
        <div className="auth-panel">
          <div className={"auth-user"}>
            <TextInput
              style={{ width: 150, marginRight: 10, float: "left" }}
              placeholder="Your name"
              value={stringValue.trim()}
              onChange={(event) => setStringValue(event.currentTarget.value)}
            />
            <Button
              variant="gradient"
              gradient={{ from: "teal", to: "lime", deg: 105 }}
              onClick={(event) => {
                if (stringValue.length > 5) {
                  setUsernameValue(stringValue);
                } else {
                  setError(true);
                }
              }}
            >
              Login
            </Button>
          </div>
          {error ? (
            <div className="error-message">
              *name should be at least 6 symbols long
            </div>
          ) : null}
        </div>
      </>
    );
  } else {
    return <RouletteWrapper username={usernameValue} />;
  }
}
export default App;
root.render(<App />);

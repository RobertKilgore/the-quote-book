import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import { SignatureProvider } from './context/SignatureContext';
import { UnapprovedQuoteProvider } from "./context/UnapprovedQuoteContext";
import { UnapprovedUserProvider } from "./context/UnapprovedUserContext";
import { NavbarProvider } from "./context/NavbarContext";
import { UnratedQuoteProvider } from "./context/UnratedQuoteContext";
import { FlaggedQuoteProvider } from "./context/FlaggedQuoteContext";
import { UserProvider } from "./context/UserContext";
import { ErrorProvider } from "./context/ErrorContext";
import { SuccessProvider } from "./context/SuccessContext";


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <UnapprovedQuoteProvider>
      <SignatureProvider>
          <UnapprovedUserProvider>
            <NavbarProvider>
              <UnratedQuoteProvider>
                <FlaggedQuoteProvider>
                  <UserProvider>
                    <ErrorProvider>
                      <SuccessProvider>
                        <div id="root" className="max-w-full overflow-x-hidden"><App /></div>
                      </SuccessProvider>
                    </ErrorProvider>
                  </UserProvider>
                </FlaggedQuoteProvider>
              </UnratedQuoteProvider>
            </NavbarProvider>
          </UnapprovedUserProvider>
      </SignatureProvider>
    </UnapprovedQuoteProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

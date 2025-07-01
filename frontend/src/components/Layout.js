import React from "react";
import { Link } from "react-router-dom";

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <header className="bg-white shadow-md p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">📖 The Quote Book</h1>
        <nav className="space-x-4">
          <Link to="/" className="hover:text-blue-600">Home</Link>
          <Link to="/login" className="hover:text-blue-600">Login</Link>
          <Link to="/request-account" className="hover:text-blue-600">Request Account</Link>
          <Link to="/create-quote" className="hover:text-blue-600">Submit Quote</Link>
        </nav>
      </header>
      <main className="p-6">
        {children}
      </main>
    </div>
  );
};

export default Layout;
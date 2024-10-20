import React, { ChangeEvent, useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

// Define a type for the wine data
interface Wine {
  wine_id: number;
  name: string;
  vintage: number;
  totalQuantity: number;
  totalRevenue: number;
  totalOrders: number;
}

function App() {
  const [wines, setWines] = useState<Wine[]>([]); // State for wine data
  const [criteria, setCriteria] = useState<string>('revenue'); // Sorting criteria
  const [searchQuery, setSearchQuery] = useState<string>(''); // Search query

  // Base URL for Fastify server
  const BASE_URL = 'http://localhost:3000'; // Change to your server's URL if needed

  // Fetch all wines based on the current criteria
  const fetchWines = async () => {
    try {
      const response = await axios.get<Wine[]>(`${BASE_URL}/wines`, {
        params: { criteria }, // Passing the criteria parameter
      });
      setWines(response.data); // Set the fetched wines to the state
    } catch (error) {
      console.error('Error fetching wines:', error);
    }
  };

  // Search wines by name or vintage
  const searchWines = async () => {
    try {
      const response = await axios.get<Wine[]>(`${BASE_URL}/wines/search`, {
        params: { query: searchQuery }, // Passing the search query parameter
      });
      setWines(response.data); // Set the searched wines to the state
    } catch (error) {
      console.error('Error searching wines:', error);
    }
  };

  // Fetch wines when the component mounts or criteria changes
  useEffect(() => {
    fetchWines();
  }, [criteria]);

  // Handle search input change
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle criteria change in the select dropdown
  const handleCriteriaChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setCriteria(e.target.value);
  };
  

  return (
      <div className="App">
        <h1>Best Selling Wines</h1>

        <div>
          <label>Sort by: </label>
          <select value={criteria} onChange={handleCriteriaChange}>
            <option value="revenue">Revenue</option>
            <option value="quantity">Quantity</option>
            <option value="orders">Orders</option>
          </select>
        </div>

        <div>
          <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search wines"
          />
          <button onClick={searchWines}>Search</button>
        </div>

        <ul>
          {wines.map((wine) => (
              <li key={wine.wine_id}>
                {wine.name} ({wine.vintage}) - Orders: {wine.totalOrders}, Revenue: $
                {wine.totalRevenue}
              </li>
          ))}
        </ul>
      </div>
  );
};

export default App;

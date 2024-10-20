import React, {ChangeEvent, useEffect, useState} from "react";
import axios from 'axios';
import "./App.css";

interface Wine {
  wine_id: number;
  name: string;
  vintage: number;
  totalQuantity: number;
  totalRevenue: number;
  totalOrders: number;
}

function App() {
  const [wines, setWines] = useState<Wine[]>([]);
  const [criteria, setCriteria] = useState<string>('revenue');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fetch all wines based on the current criteria (revenue, quantity, or orders)
  const fetchWines = async () => {
    try {
      const response = await axios.get<Wine[]>('http://localhost:3000/wines', {
        params: { criteria }, // passing the criteria parameter
      });
      setWines(response.data); // Set the fetched wines to the state
    } catch (error) {
      console.error('Error fetching wines:', error);
    }
  };

  // Search wines by name or vintage
  const searchWines = async () => {
    try {
      const response = await axios.get<Wine[]>('http://localhost:3000/wines/search', {
        params: { query: searchQuery },  // passing the search query parameter
      });
      setWines(response.data); // Set the searched wines to the state
    } catch (error) {
      console.error('Error searching wines:', error);
    }
  };

  useEffect(() => {
    fetchWines(); // Fetch wines when the component mounts or criteria changes
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

        <div className="controls">
          <select value={criteria} onChange={e => setCriteria(e.target.value)}>
            <option value="revenue">Revenue</option>
            <option value="quantity">Total Bottles Sold</option>
            <option value="orders">Number of Orders</option>
          </select>

          <input
              type="text"
              placeholder="Search by name or vintage"
              value={searchQuery}
              onChange={handleSearch}
          />
        </div>

        <ul>
          {wines.map((wine, index) => (
              <li
                  key={`${wine.name}-${wine.vintage}`}
                  className={
                    index < top10Percent ? 'top10' :
                        index >= wines.length - bottom10Percent ? 'bottom10' : ''
                  }
              >
                {wine.name} ({wine.vintage}) - {wine.totalRevenue.toFixed(2)} - {wine.totalQuantity} bottles sold
              </li>
          ))}
        </ul>
      </div>
  );
};

export default App;

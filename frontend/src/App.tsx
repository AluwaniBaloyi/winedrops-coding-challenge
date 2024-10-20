import React, { useEffect, useState } from "react";
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

  useEffect(() => {
    fetch(`http://localhost:3000/wines?criteria=${criteria}`)
        .then((response) => response.json())
        .then((data: Wine[]) => setWines(data))
        .catch((error) => console.error('Error fetching wine data:', error));
  }, [criteria]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    fetch(`http://localhost:3000/wines/search?query=${e.target.value}`)
        .then((response) => response.json())
        .then((data: Wine[]) => setWines(data))
        .catch((error) => console.error('Error fetching search results:', error));
  };

  const top10Percent = wines.length ? Math.ceil(wines.length * 0.1) : 0;
  const bottom10Percent = wines.length ? Math.ceil(wines.length * 0.1) : 0;

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

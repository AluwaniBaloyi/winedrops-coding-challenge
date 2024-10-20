import Fastify, {FastifyInstance} from "fastify";
import cors from "@fastify/cors";
import sqlite3 from "sqlite3";
import { join } from "path";

(async () => {
  const fastify: FastifyInstance = Fastify({ logger: true });
  const dbPath = join(process.cwd(), 'db/winedrops.db'); // current working directory

  // Register CORS (with more specific configuration)
  fastify.register(cors, {
    origin: 'http://localhost:5173', // Allow only requests from your frontend
  });

// SQLite Database Connection
  const db = new sqlite3.Database(dbPath);

  interface Wine {
    wine_id: number;
    name: string;
    vintage: number;
    totalQuantity: number;
    totalRevenue: number;
    totalOrders: number;
  }

  // Helper: Aggregate Wine Data
  function aggregateWineData(rows: any[]): Wine[] {
    const wineMap: { [key: number]: Wine } = {};

    rows.forEach(row => {
      const { wine_id, name, vintage, quantity, total_amount } = row;

      if (!wineMap[wine_id]) {
        wineMap[wine_id] = {
          wine_id,
          name,
          vintage,
          totalQuantity: 0,
          totalRevenue: 0,
          totalOrders: 0
        };
      }

      wineMap[wine_id].totalQuantity += quantity;
      wineMap[wine_id].totalRevenue += total_amount;
      wineMap[wine_id].totalOrders += 1;
    });

    return Object.values(wineMap);
  }

// Convert db.all to a promise
  function runQuery(query: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      db.all(query, [], (err, rows) => {
        if (err) {
          reject(err); // If there's an error, reject the promise
        } else {
          resolve(rows); // If successful, resolve the promise with rows
        }
      });
    });
  }

  fastify.get('/wines', async (request, reply) => {
    const { criteria = 'revenue' } = request.query as { criteria: string };

    const query = `
      SELECT mw.id as wine_id, mw.name, mw.vintage, co.quantity, co.total_amount
      FROM customer_order co
             JOIN wine_product wp ON co.wine_product_id = wp.id
             JOIN master_wine mw ON wp.master_wine_id = mw.id
      WHERE co.status IN ('paid', 'dispatched')
    `;

    try {
      const rows = await runQuery(query); // Await the promise
      const wines = aggregateWineData(rows);

      // Sort wines based on the criteria
      wines.sort((a, b) => {
        if (criteria === 'revenue') {
          return b.totalRevenue - a.totalRevenue;
        } else if (criteria === 'quantity') {
          return b.totalQuantity - a.totalQuantity;
        } else if (criteria === 'orders') {
          return b.totalOrders - a.totalOrders;
        }
        return 0;
      });

      reply.send(wines); // Send the wines data
    } catch (err) {
      reply.status(500).send({ error: 'Database error' }); // Handle the error
    }
  });



  fastify.get('/wines/search', async (request, reply) => {
    const { query = '' } = request.query as { query: string };

    const sqlQuery = `
    SELECT mw.id as wine_id, mw.name, mw.vintage, co.quantity, co.total_amount
    FROM customer_order co
    JOIN wine_product wp ON co.wine_product_id = wp.id
    JOIN master_wine mw ON wp.master_wine_id = mw.id
    WHERE co.status IN ('paid', 'dispatched') AND (LOWER(mw.name) LIKE ? OR mw.vintage LIKE ?)
  `;

    try {
      const rows = await new Promise((resolve, reject) => {
        db.all(sqlQuery, [`%${query.toLowerCase()}%`, `%${query}%`], (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
      });

      const wines = aggregateWineData(rows);
      reply.send(wines);
    } catch (err) {
      reply.status(500).send({ error: 'Database error' });
    }
  });


  // Run the server
  const start = async () => {
    try {
      await fastify.listen({ port: 3000 });
      fastify.log.info(`Server running at http://localhost:3000`);
    } catch (err) {
      fastify.log.error(err);
      process.exit(1);
    }
  };

  start();
})();

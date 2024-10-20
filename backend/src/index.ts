import Fastify, {FastifyInstance} from "fastify";
import cors from "@fastify/cors";
import sqlite3 from "sqlite3";
import { join } from "path";

(async () => {
  const fastify: FastifyInstance = Fastify({ logger: true });
  const dbPath = join(__dirname, 'db/winedrops.db');

  // Register CORS (with more specific configuration)
  fastify.register(cors, {
    origin: 'http://localhost:5173', // Allow only requests from your frontend
    methods: ['GET'], // Allow specific HTTP methods if needed
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

// Get Wines - Filter by "best selling" criteria
  fastify.get('/wines', async (request, reply) => {
    const { criteria = 'revenue' } = request.query as { criteria: string };

    const query = `
    SELECT mw.id as wine_id, mw.name, mw.vintage, co.quantity, co.total_amount
    FROM customer_order co
    JOIN wine_product wp ON co.wine_product_id = wp.id
    JOIN master_wine mw ON wp.master_wine_id = mw.id
    WHERE co.status IN ('paid', 'dispatched')
  `;

    db.all(query, [], (err: any, rows: any[]) => {
      if (err) {
        return reply.status(500).send({ error: 'Database error' });
      }

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

      reply.send(wines);
    });
  });

// Search Wines
  fastify.get('/wines/search', async (request, reply) => {
    const { query = '' } = request.query as { query: string };

    const sqlQuery = `
    SELECT mw.id as wine_id, mw.name, mw.vintage, co.quantity, co.total_amount
    FROM customer_order co
    JOIN wine_product wp ON co.wine_product_id = wp.id
    JOIN master_wine mw ON wp.master_wine_id = mw.id
    WHERE co.status IN ('paid', 'dispatched') AND (LOWER(mw.name) LIKE ? OR mw.vintage LIKE ?)
  `;

    db.all(sqlQuery, [`%${query.toLowerCase()}%`, `%${query}%`], (err: any, rows: any[]) => {
      if (err) {
        return reply.status(500).send({ error: 'Database error' });
      }

      const wines = aggregateWineData(rows);
      reply.send(wines);
    });
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

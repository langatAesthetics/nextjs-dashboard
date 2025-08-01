// app/seed/route.ts
import { NextResponse } from 'next/server';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';
import { users, customers, invoices, revenue } from '@/app/lib/placeholder-data';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export async function GET() {
  try {
    // 1️⃣ Drop existing tables to prevent duplicate errors
    await sql`DROP TABLE IF EXISTS invoices`;
    await sql`DROP TABLE IF EXISTS customers`;
    await sql`DROP TABLE IF EXISTS users`;
    await sql`DROP TABLE IF EXISTS revenue`;

    // 2️⃣ Re-create tables
    await sql`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      )
    `;

    await sql`
      CREATE TABLE customers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        image_url TEXT
      )
    `;

    await sql`
      CREATE TABLE invoices (
        id SERIAL PRIMARY KEY,
        customer_id INT REFERENCES customers(id),
        amount INT NOT NULL,
        status TEXT CHECK (status IN ('pending','paid')),
        date DATE NOT NULL
      )
    `;

    await sql`
      CREATE TABLE revenue (
        id SERIAL PRIMARY KEY,
        month TEXT NOT NULL,
        income INT NOT NULL
      )
    `;

    // 3️⃣ Insert Users with hashed passwords
    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await sql`
        INSERT INTO users (name, email, password)
        VALUES (${user.name}, ${user.email}, ${hashedPassword})
      `;
    }

    // 4️⃣ Insert Customers
    for (const customer of customers) {
      await sql`
        INSERT INTO customers (id, name, email, image_url)
        VALUES (${customer.id}, ${customer.name}, ${customer.email}, ${customer.image_url})
      `;
    }

    // 5️⃣ Insert Invoices
    for (const invoice of invoices) {
      await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${invoice.customer_id}, ${invoice.amount}, ${invoice.status}, ${invoice.date})
      `;
    }

    // 6️⃣ Insert Revenue
    for (const rev of revenue) {
      await sql`
        INSERT INTO revenue (month, income)
        VALUES (${rev.month}, ${rev.revenue})
      `;
    }

    return NextResponse.json({ message: 'Database seeded successfully ✅' });
  } catch (err) {
    console.error('Seeding error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  } finally {
    await sql.end(); // close connection to avoid prepared statement errors
  }
}

import type { ColumnInfo, TableInfo } from "@/data/mockSchema";

const firstNames = ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Hasan", "Ivy", "Jack", "Kira", "Liam", "Maya", "Noor", "Oscar", "Priya", "Quinn", "Ravi", "Sara", "Tao"];
const lastNames = ["Johnson", "Chen", "Ahmed", "Garcia", "Kim", "Patel", "Muller", "Santos", "Nguyen", "Williams", "Taylor", "Brown", "Wilson", "Singh", "Li", "Anderson", "Akter", "Khan", "Tanaka", "Ali"];
const countries = ["Bangladesh", "India", "USA", "UK", "Germany", "Canada", "Singapore", "Japan", "Brazil", "Australia", "France", "Nigeria", "South Korea", "Indonesia", "Mexico"];
const paths = ["/", "/about", "/pricing", "/docs", "/blog", "/contact", "/dashboard", "/settings", "/products", "/signup"];
const referrers = ["google.com", "twitter.com", "reddit.com", "hn.com", null, null, "linkedin.com", "facebook.com"];
const actions = ["INSERT", "UPDATE", "DELETE", "SELECT"];
const eventNames = ["page_view", "click", "signup", "purchase", "logout", "search", "download", "share"];
const categories = ["Electronics", "Clothing", "Books", "Home", "Sports", "Food", "Toys", "Beauty"];
const slugs = ["electronics", "clothing", "books", "home", "sports", "food", "toys", "beauty"];
const productNames = ["Widget Pro", "Gadget X", "Super Tool", "Mega Pack", "Ultra Lens", "Smart Hub", "Power Bank", "Eco Bag"];

function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function randomDate(daysBack = 730): string {
  const d = new Date(Date.now() - Math.random() * daysBack * 86400000);
  return d.toISOString();
}

function randomEmail(name: string): string {
  const domains = ["gmail.com", "outlook.com", "proton.me", "yahoo.com", "company.io"];
  return `${name.toLowerCase().replace(/\s/g, ".")}${Math.floor(Math.random() * 99)}@${domains[Math.floor(Math.random() * domains.length)]}`;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateCellValue(col: ColumnInfo, tableName: string): unknown {
  if (col.isNullable && Math.random() < 0.15) return null;

  if (col.enumValues && col.enumValues.length > 0) return pick(col.enumValues);

  const t = col.type.toLowerCase();
  const n = col.name.toLowerCase();

  if (t === "uuid") return uuid();
  if (t.includes("bool")) return n === "is_active" ? Math.random() > 0.2 : Math.random() > 0.5;
  if (t.includes("timestamp") || t.includes("date")) return randomDate();

  if (t.includes("int")) {
    if (n.includes("quantity")) return Math.floor(Math.random() * 20) + 1;
    if (n.includes("stock")) return Math.floor(Math.random() * 500);
    if (n.includes("port")) return 5432;
    return Math.floor(Math.random() * 1000);
  }

  if (t.includes("numeric") || t.includes("decimal") || t.includes("float") || t.includes("real")) {
    if (n.includes("price") || n.includes("amount") || n.includes("unit_price"))
      return parseFloat((Math.random() * 500 + 5).toFixed(2));
    return parseFloat((Math.random() * 1000).toFixed(2));
  }

  if (t === "jsonb" || t === "json") return JSON.stringify({ key: "value", count: Math.floor(Math.random() * 100) });
  if (t === "inet") return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

  // text types
  if (n === "email") return randomEmail(pick(firstNames) + " " + pick(lastNames));
  if (n === "name" && tableName === "users") return pick(firstNames) + " " + pick(lastNames);
  if (n === "name" && tableName === "products") return pick(productNames);
  if (n === "name" && tableName === "categories") return pick(categories);
  if (n === "name" && tableName === "events") return pick(eventNames);
  if (n === "country") return pick(countries);
  if (n === "slug") return pick(slugs);
  if (n === "path") return pick(paths);
  if (n === "referrer") return pick(referrers) || null;
  if (n === "currency") return pick(["USD", "EUR", "GBP", "BDT", "INR"]);
  if (n === "action") return pick(actions);
  if (n.includes("table_name")) return pick(["users", "orders", "products"]);
  if (n.includes("provider")) return pick(["email", "google", "github"]);
  if (n.includes("provider_id")) return uuid().slice(0, 12);
  if (n.includes("url")) return `https://example.com/img/${Math.floor(Math.random() * 100)}.jpg`;
  if (n === "notes") return Math.random() > 0.5 ? pick(["Rush delivery", "Gift wrapped", "Fragile item", "Repeat customer"]) : null;
  return `${col.name}_${Math.floor(Math.random() * 9999)}`;
}

export function generateMockRows(table: TableInfo, count = 15): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  for (let i = 0; i < count; i++) {
    const row: Record<string, unknown> = {};
    for (const col of table.columns) {
      row[col.name] = generateCellValue(col, table.name);
    }
    rows.push(row);
  }
  return rows;
}

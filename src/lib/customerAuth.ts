import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/types";

export const demoCustomer = {
  name: "Анастасія Щерук",
  email: "nastay.sheruk05@gmail.com",
  password: "183249700Na",
  phone: "+380688252737",
  city: "Миколаїв",
  address: "",
  photo: "/logo-pic.png"
};

function splitCustomerName(name: string) {
  const parts = String(name || "").trim().split(" ").filter(Boolean);

  return {
    firstName: parts[0] || "Користувач",
    lastName: parts.slice(1).join(" ")
  };
}

export function customerToSession(customer: {
  id: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  photo: string;
  createdAt: Date;
}): SessionUser {
  const names = splitCustomerName(customer.name);

  return {
    id: String(customer.id),
    role: "user",
    firstName: names.firstName,
    lastName: names.lastName,
    name: customer.name || `${names.firstName} ${names.lastName}`.trim(),
    email: customer.email,
    photo: customer.photo || "/logo-pic.png",
    phone: customer.phone || "",
    city: customer.city || "",
    address: customer.address || "",
    createdAt: customer.createdAt.toISOString()
  };
}

export async function ensureDemoCustomer() {
  return prisma.customer.upsert({
    where: {
      email: demoCustomer.email
    },
    update: {
      name: demoCustomer.name,
      password: demoCustomer.password,
      phone: demoCustomer.phone,
      city: demoCustomer.city,
      address: demoCustomer.address,
      photo: demoCustomer.photo
    },
    create: {
      name: demoCustomer.name,
      email: demoCustomer.email,
      password: demoCustomer.password,
      phone: demoCustomer.phone,
      city: demoCustomer.city,
      address: demoCustomer.address,
      photo: demoCustomer.photo
    }
  });
}
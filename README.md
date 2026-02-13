# Sistem Satu Pintu – GKI Batu

A web-based request management system for church administrative services.

This application allows users to submit requests online and enables internal staff to manage, review, and complete them in a structured workflow.

---

## ✨ Features

* Public request submission form
* Role-based dashboard access
* Status tracking workflow
* Monthly reporting
* WhatsApp notification integration

---

## 🛠 Tech Stack

* Next.js (App Router)
* Supabase (PostgreSQL + Auth)
* Tailwind CSS
* WhatsApp API Integration
* Deployed on Vercel

---

## 🔐 Authentication

Authentication and authorization are handled using Supabase Auth with role-based access control.

> Access credentials are not included in this repository.

---

## ⚙️ Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

WHATSAPP_API_KEY=
WHATSAPP_API_URL=
```

---

## 🚀 Getting Started

```bash
npm install
npm run dev
```

---

## 📦 Deployment

This project is configured for deployment on Vercel.

---

## 📝 Notes

* Database schema and internal workflow are intentionally not documented in detail.
* This repository is intended for deployment reference and demonstration purposes.

---

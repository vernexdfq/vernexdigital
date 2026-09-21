import Link from "next/link";
import { ArrowRight, Plane, ShoppingBag } from "lucide-react";

const services = [
  {
    href: "/services/flights",
    label: "Flight Booking",
    desc: "Search and book flights for your next trip.",
    icon: Plane,
  },
  {
    href: "/services/shopping",
    label: "Shopping",
    desc: "Shop for products and manage your purchases in one place.",
    icon: ShoppingBag,
  },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-white pb-24">
      <header className="px-4 pt-7 pb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1877F2]">
          Vernex Digital
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#0F172A]">
          Services
        </h1>
        <p className="mt-1 text-sm text-[#64748B]">
          Choose a service to continue
        </p>
      </header>

      <main className="px-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {services.map((service) => {
            const Icon = service.icon;

            return (
              <Link
                key={service.href}
                href={service.href}
                className="group flex min-h-[190px] flex-col justify-between rounded-[14px] border border-[#DCE3EC] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition-all hover:-translate-y-0.5 hover:border-[#1877F2]/40 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
              >
                <div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-[12px] bg-[#EFF6FF] text-[#1877F2]">
                    <Icon size={28} strokeWidth={2} />
                  </div>

                  <h2 className="mt-6 text-xl font-bold tracking-tight text-[#0F172A]">
                    {service.label}
                  </h2>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#64748B]">
                    {service.desc}
                  </p>
                </div>

                <div className="mt-7 flex items-center gap-2 text-sm font-semibold text-[#1877F2]">
                  Explore service
                  <ArrowRight
                    size={17}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}

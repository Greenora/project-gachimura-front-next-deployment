"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PartyCard from "./PartyCard";
import { clientFetch } from "@/app/hooks/useClientFetch";
import { Spinner } from "../common/Icons";
import { useLanguage } from "@/app/hooks/LanguageContext";

export default function PartyList() {
  const [parties, setParties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const { texts } = useLanguage();

  const search = searchParams.get("search");
  const filter = searchParams.get("filter") || "latest";
  const completed = searchParams.get("completed") || "true";

  useEffect(() => {
    const fetchParties = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        if (filter) params.append("sort", filter);
        if (completed) params.append("completed", completed);

        const data = await clientFetch(`/parties?${params.toString()}`);
        setParties(data);
      } catch (error) {
        console.error("Failed to fetch parties:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchParties();
  }, [search, filter, completed]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Spinner />
        <p className="text-gray-500 font-medium">{texts.main.loadingParties}</p>
      </div>
    );
  }

  if (parties.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 font-bold text-lg">{texts.main.noParties}</p>
        <p className="text-gray-400 mt-2">{texts.main.firstPartyMsg}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
      {parties.map((party) => (
        <PartyCard key={party.id} party={party} />
      ))}
    </div>
  );
}

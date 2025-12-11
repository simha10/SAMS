import { useState, useEffect } from "react";
import { branchAPI } from "@/services/api";
import type { Branch } from "@/types";
import { loadBranchesFromCache, saveBranchesToCache } from "@/utils/branchCache";

export function useBranches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBranches = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // First, try to load from cache
      const cachedBranches = loadBranchesFromCache();
      if (cachedBranches) {
        console.log("Loaded branch data from cache");
        setBranches(cachedBranches);
        setLoading(false);
        return;
      }

      // Fetch from API if no cache exists
      const response = await branchAPI.getBranches();
      if (response.success) {
        setBranches(response.data.branches);
        // Save to cache
        saveBranchesToCache(response.data.branches);
      } else {
        setError(response.message || "Failed to fetch branches");
      }
    } catch (err) {
      setError("Failed to fetch branches. Please try again.");
      console.error("Failed to fetch branches:", err);
    } finally {
      setLoading(false);
    }
  };

  const refreshBranches = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await branchAPI.getBranches();
      if (response.success) {
        setBranches(response.data.branches);
        // Save to cache
        saveBranchesToCache(response.data.branches);
      } else {
        setError(response.message || "Failed to fetch branches");
      }
    } catch (err) {
      setError("Failed to fetch branches. Please try again.");
      console.error("Failed to fetch branches:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch branches on component mount
  useEffect(() => {
    fetchBranches();
  }, []);

  return {
    branches,
    loading,
    error,
    fetchBranches,
    refreshBranches
  };
}
import useSWR from 'swr';

const fetcher = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `API error: ${res.status}`);
  }
  return res.json();
};

export function useApi(url, options = {}) {
  return useSWR(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
    ...options,
  });
}

export default useApi;

import { useState, useEffect, useCallback } from 'react';

export function useBuilderData<T>(endpoint: string, initialData: T[] = []) {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(true);

  const fetchIt = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/builder/${endpoint}`, {
        headers: { Authorization: `Bearer ${token || ''}` }
      });
      
      if (res.ok) {
        const fetched = await res.json();
        if (fetched && Array.isArray(fetched)) {
          // No more Frankenstein merging of local mocked data!
          // We return exactly what the database gives us.
          setData(fetched);
        } else {
          setData([]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchIt();
  }, [fetchIt]);

  const createItem = async (payload: any) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/builder/${endpoint}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await fetchIt();
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const updateItem = async (id: string | number, payload: any) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/builder/${endpoint}/${id}`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await fetchIt();
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const deleteItem = async (id: string | number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/builder/${endpoint}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token || ''}` }
      });
      if (res.ok) {
        await fetchIt();
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  return { data, loading, refetch: fetchIt, createItem, updateItem, deleteItem };
}

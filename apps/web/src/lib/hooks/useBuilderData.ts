/* eslint-disable */
import { useState, useEffect, useCallback } from 'react';

export function useBuilderData<T>(endpoint: string, initialData: T[]) {
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
        if (fetched && fetched.length > 0) {
          const mapped = fetched.map((d: any, index: number) => {
            let fieldsCount = 0;
            if (d.fields || d.nodes || d.conditions || d.columns || d.entities) {
              const target = d.fields || d.nodes || d.conditions || d.columns || d.entities;
              fieldsCount = typeof target === 'string' ? JSON.parse(target).length : target.length;
            }

            return {
              ...initialData[index % initialData.length],
              id: d.id,
              name: d.name || d.title,
              slug: d.slug,
              status: d.status === 'ACTIVE' || d.status === 'PUBLISHED' ? 'Published' : 'Draft',
              updatedAt: new Date(d.updatedAt).toLocaleDateString(),
              lastEdited: new Date(d.updatedAt).toLocaleDateString(),
              lastTriggered: new Date(d.updatedAt).toLocaleDateString(),
              fields: fieldsCount || (d.entities ? fieldsCount * 5 : 0),
              steps: fieldsCount,
              tables: d.entities ? fieldsCount : 0,
              submissions: 0,
              pendingCount: 0,
              author: d.author || 'Admin',
              views: d.views || 0,
            };
          });
          setData(mapped);
        } else {
          setData([]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [endpoint, initialData]);

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

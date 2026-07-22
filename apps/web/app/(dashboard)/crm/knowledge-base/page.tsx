'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { Card, PageHeader, Spinner, Button, Badge, ProtectedComponent } from '@unerp/ui';
import { Plus, Search, Edit3, Trash2, FileText, FolderOpen, ThumbsUp, Eye } from 'lucide-react';
import Link from 'next/link';
import { apiGet, apiSend } from '../_components/api';

interface KbCategory {
  id: string; name: string; description?: string | null; parentId?: string | null;
  children?: KbCategory[]; articles?: KbArticle[];
}
interface KbArticle {
  id: string; title: string; categoryId: string; status: string; views: number;
  helpfulCount: number; notHelpfulCount: number; createdAt: string;
  category?: { id: string; name: string };
}
interface KbStats { totalArticles: number; publishedArticles: number; totalViews: number; categories: number; }

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState<KbArticle[]>([]);
  const [categories, setCategories] = useState<KbCategory[]>([]);
  const [stats, setStats] = useState<KbStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [catName, setCatName] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [articlesData, catsData, statsData] = await Promise.all([
        apiGet<KbArticle[]>('/crm/knowledge-base/articles?limit=50'),
        apiGet<KbCategory[]>('/crm/knowledge-base/categories'),
        apiGet<KbStats>('/crm/knowledge-base/stats'),
      ]);
      setArticles(Array.isArray(articlesData) ? articlesData : []);
      setCategories(Array.isArray(catsData) ? catsData : []);
      setStats(statsData as KbStats);
    } catch { /* empty */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createCategory = async () => {
    if (!catName.trim()) return;
    await apiSend('/crm/knowledge-base/categories', 'POST', { name: catName });
    setCatName(''); setShowNewCategory(false); load();
  };

  const deleteArticle = async (id: string) => {
    if (confirm('Delete this article?')) {
      await apiSend(`/crm/knowledge-base/articles/${id}`, 'DELETE');
      load();
    }
  };

  const togglePublish = async (article: KbArticle) => {
    const endpoint = article.status === 'PUBLISHED'
      ? `/crm/knowledge-base/articles/${article.id}/archive`
      : `/crm/knowledge-base/articles/${article.id}/publish`;
    await apiSend(endpoint, 'POST', {});
    load();
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Knowledge Base"
        description="Manage articles, categories, and documentation"
        actions={
          <div className="flex gap-2">
            <Link href="/crm/knowledge-base/new">
              <Button variant="primary" size="sm"><Plus className="w-4 h-4 mr-1" />New Article</Button>
            </Link>
            <Button variant="secondary" size="sm" onClick={() => setShowNewCategory(true)}>
              <FolderOpen className="w-4 h-4 mr-1" />New Category
            </Button>
          </div>
        }
      />

      {stats && (
        <div className="ui-grid-4">
          <Card><div className="text-2xl font-bold">{stats.totalArticles}</div><div className="text-sm text-gray-500">Total Articles</div></Card>
          <Card><div className="text-2xl font-bold">{stats.publishedArticles}</div><div className="text-sm text-gray-500">Published</div></Card>
          <Card><div className="text-2xl font-bold">{stats.totalViews}</div><div className="text-sm text-gray-500">Total Views</div></Card>
          <Card><div className="text-2xl font-bold">{stats.categories}</div><div className="text-sm text-gray-500">Categories</div></Card>
        </div>
      )}

      {showNewCategory && (
        <Card className="p-4">
          <div className="ui-form-group">
            <label className={labelStyle}>Category Name</label>
            <input className={inputStyle} value={catName} onChange={e => setCatName(e.target.value)} placeholder="e.g. Sales, Onboarding" />
            <div className="flex gap-2 mt-2">
              <Button variant="primary" size="sm" onClick={createCategory}>Create</Button>
              <Button variant="secondary" size="sm" onClick={() => { setShowNewCategory(false); setCatName(''); }}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}

      <div className="ui-grid-2">
        <Card title="Categories">
          {categories.length === 0 ? <p className="text-sm text-gray-400">No categories yet</p> : (
            <ul className="space-y-1">
              {categories.map(cat => (
                <li key={cat.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <span><FolderOpen className="w-4 h-4 inline mr-2" />{cat.name}</span>
                  <Badge variant="outline">{cat.articles?.length || 0}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Recent Articles">
          {articles.length === 0 ? <p className="text-sm text-gray-400">No articles yet</p> : (
            <ul className="space-y-2">
              {articles.slice(0, 10).map(article => (
                <li key={article.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <div>
                    <Link href={`/crm/knowledge-base/${article.id}`} className="font-medium hover:underline">
                      <FileText className="w-4 h-4 inline mr-2" />{article.title}
                    </Link>
                    <div className="text-xs text-gray-400 mt-1">
                      {article.category?.name && <span className="mr-3">{article.category.name}</span>}
                      <Eye className="w-3 h-3 inline mr-1" />{article.views}
                      <ThumbsUp className="w-3 h-3 inline ml-2 mr-1" />{article.helpfulCount}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={article.status === 'PUBLISHED' ? 'success' : 'warning'}>{article.status}</Badge>
                    <ProtectedComponent permission="crm.knowledgebase.update">
                      <Button variant="ghost" size="sm" onClick={() => togglePublish(article)}>
                        {article.status === 'PUBLISHED' ? 'Archive' : 'Publish'}
                      </Button>
                    </ProtectedComponent>
                    <ProtectedComponent permission="crm.knowledgebase.delete">
                      <Button variant="ghost" size="sm" onClick={() => deleteArticle(article.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </ProtectedComponent>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

const labelStyle = "block text-sm font-medium text-gray-700 mb-1";
const inputStyle = "w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

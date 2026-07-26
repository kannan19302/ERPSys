"use client";
import React, { useEffect, useState } from "react";
import { Card, PageHeader, Spinner, Button, Badge } from "@unerp/ui";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  FolderOpen,
  Eye,
  ThumbsUp,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { apiGet, apiSend } from "../_components/api";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  sortOrder: number;
  parentId?: string;
  _count?: { articles: number };
}
interface Article {
  id: string;
  title: string;
  slug: string;
  status: string;
  viewCount: number;
  helpfulCount: number;
  categoryId: string;
  category?: { id: string; name: string };
  createdAt: string;
}

export default function HelpCenterPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    string | undefined
  >();
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [catForm, setCatForm] = useState({
    name: "",
    slug: "",
    description: "",
  });
  const [artForm, setArtForm] = useState({
    title: "",
    slug: "",
    content: "",
    status: "DRAFT",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [cats, arts] = await Promise.all([
        apiGet<Category[]>("/api/crm/support/help-center/categories"),
        apiGet<{ data: Article[] }>(
          `/api/crm/support/help-center/articles?${selectedCategory ? `categoryId=${selectedCategory}&` : ""}${search ? `search=${search}&` : ""}limit=50`,
        ),
      ]);
      setCategories(cats || []);
      setArticles(arts?.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory, search]);

  const createCategory = async () => {
    await apiSend("/api/crm/support/help-center/categories", "POST", catForm);
    setShowCategoryForm(false);
    setCatForm({ name: "", slug: "", description: "" });
    loadData();
  };

  const deleteCategory = async (id: string) => {
    await apiSend(`/api/crm/support/help-center/categories/${id}`, "DELETE");
    loadData();
  };

  const createArticle = async () => {
    await apiSend("/api/crm/support/help-center/articles", "POST", artForm);
    setShowArticleForm(false);
    setArtForm({ title: "", slug: "", content: "", status: "DRAFT" });
    loadData();
  };

  const deleteArticle = async (id: string) => {
    await apiSend(`/api/crm/support/help-center/articles/${id}`, "DELETE");
    loadData();
  };

  return (
    <div className="ui-page">
      <PageHeader
        title="Help Center"
        description="Manage knowledge base categories and articles"
      />
      <div className="ui-flex ui-gap-3 ui-mb-4">
        <div className="ui-input-group" style={{ flex: 1 }}>
          <Search size={16} />
          <input
            className="ui-input"
            placeholder="Search articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => setShowCategoryForm(true)}>
          <Plus size={14} /> Category
        </Button>
        <Button onClick={() => setShowArticleForm(true)}>
          <Plus size={14} /> Article
        </Button>
      </div>

      {showCategoryForm && (
        <Card className="ui-mb-4">
          <div className="ui-card-body">
            <h3 className="ui-card-title">New Category</h3>
            <div className="ui-form-group">
              <label className="ui-label">Name</label>
              <input
                className="ui-input"
                value={catForm.name}
                onChange={(e) =>
                  setCatForm({
                    ...catForm,
                    name: e.target.value,
                    slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                  })
                }
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Slug</label>
              <input
                className="ui-input"
                value={catForm.slug}
                onChange={(e) =>
                  setCatForm({ ...catForm, slug: e.target.value })
                }
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Description</label>
              <input
                className="ui-input"
                value={catForm.description}
                onChange={(e) =>
                  setCatForm({ ...catForm, description: e.target.value })
                }
              />
            </div>
            <div className="ui-flex ui-gap-2 ui-mt-2">
              <Button onClick={createCategory}>Create</Button>
              <Button
                variant="ghost"
                onClick={() => setShowCategoryForm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {showArticleForm && (
        <Card className="ui-mb-4">
          <div className="ui-card-body">
            <h3 className="ui-card-title">New Article</h3>
            <div className="ui-form-group">
              <label className="ui-label">Title</label>
              <input
                className="ui-input"
                value={artForm.title}
                onChange={(e) =>
                  setArtForm({
                    ...artForm,
                    title: e.target.value,
                    slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                  })
                }
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Slug</label>
              <input
                className="ui-input"
                value={artForm.slug}
                onChange={(e) =>
                  setArtForm({ ...artForm, slug: e.target.value })
                }
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Content (markdown)</label>
              <textarea
                className="ui-input"
                rows={6}
                value={artForm.content}
                onChange={(e) =>
                  setArtForm({ ...artForm, content: e.target.value })
                }
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Status</label>
              <select
                className="ui-input"
                value={artForm.status}
                onChange={(e) =>
                  setArtForm({ ...artForm, status: e.target.value })
                }
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
            <div className="ui-flex ui-gap-2 ui-mt-2">
              <Button onClick={createArticle}>Create</Button>
              <Button variant="ghost" onClick={() => setShowArticleForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <Spinner />
      ) : (
        <div className="ui-grid-2">
          <Card>
            <div className="ui-card-body">
              <h3 className="ui-card-title">
                <FolderOpen size={16} /> Categories
              </h3>
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="ui-flex ui-items-center ui-justify-between ui-py-2 ui-border-b"
                >
                  <div>
                    <strong>{cat.name}</strong>
                    <span className="ui-text-xs ui-ml-2 text-muted">
                      ({cat._count?.articles || 0} articles)
                    </span>
                  </div>
                  <div className="ui-flex ui-gap-1">
                    <button
                      className="ui-btn-icon"
                      onClick={() => deleteCategory(cat.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {categories.length === 0 && (
                <p className="ui-text-sm text-muted">No categories yet</p>
              )}
            </div>
          </Card>

          <Card>
            <div className="ui-card-body">
              <h3 className="ui-card-title">
                <BookOpen size={16} /> Articles
              </h3>
              {articles.map((art) => (
                <div
                  key={art.id}
                  className="ui-flex ui-items-center ui-justify-between ui-py-2 ui-border-b"
                >
                  <div>
                    <Link
                      href={`/crm/help-center/articles/${art.id}`}
                      className="ui-link"
                    >
                      {art.title}
                    </Link>
                    <div className="ui-flex ui-gap-2 ui-text-xs text-muted ui-mt-1">
                      <Badge
                        variant={
                          art.status === "PUBLISHED" ? "success" : "default"
                        }
                      >
                        {art.status}
                      </Badge>
                      <span>
                        <Eye size={12} /> {art.viewCount}
                      </span>
                      <span>
                        <ThumbsUp size={12} /> {art.helpfulCount}
                      </span>
                      {art.category && <span>{art.category.name}</span>}
                    </div>
                  </div>
                  <div className="ui-flex ui-gap-1">
                    <Link href={`/crm/help-center/articles/${art.id}`}>
                      <button className="ui-btn-icon">
                        <Eye size={14} />
                      </button>
                    </Link>
                    <button
                      className="ui-btn-icon"
                      onClick={() => deleteArticle(art.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {articles.length === 0 && (
                <p className="ui-text-sm text-muted">No articles yet</p>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState, useCallback } from "react";
import { DndContext, useSensor, useSensors, PointerSensor, closestCenter, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
// using browser-native UUID generator
import { Helmet } from "react-helmet";
import clsx from "clsx";
import { useGeneralFileUpload } from "@/hooks/useFileUpload";
import { supabase } from "@/lib/supabase";
import { Trash2, X, ImageIcon } from "lucide-react";

interface Chapter {
  id: string;
  title: string;
  content: string;
}

type Tab = "story" | "comic" | "photo" | "cover" | "export" | "profile";

const LOCAL_KEY = "talecraft_project_v1";

export default function TaleCraftEditorPage() {
  const [tab, setTab] = useState<Tab>("story");
  // photo story state
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [photoText, setPhotoText] = useState<string>("");
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);

  // --- localStorage persistence ---
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.chapters) setChapters(parsed.chapters);
        if (parsed.selectedId) setSelectedId(parsed.selectedId);
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      LOCAL_KEY,
      JSON.stringify({ chapters, selectedId })
    );
  }, [chapters, selectedId]);

  // --- dnd-kit sensors ---
  const sensors = useSensors(useSensor(PointerSensor));

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = chapters.findIndex((c) => c.id === active.id);
    const newIndex = chapters.findIndex((c) => c.id === over.id);
    setChapters((prev) => arrayMove(prev, oldIndex, newIndex));
  };

  // --- chapter helpers ---
  const addChapter = () => {
    const newChap: Chapter = {
      id: crypto.randomUUID(),
      title: `Chapter ${chapters.length + 1}`,
      content: "",
    };
    setChapters((prev) => [...prev, newChap]);
    setSelectedId(newChap.id);
  };

  const updateChapter = (fields: Partial<Chapter>) => {
    if (!selectedId) return;
    setChapters((prev) =>
      prev.map((c) => (c.id === selectedId ? { ...c, ...fields } : c))
    );
  };

  const current = chapters.find((c) => c.id === selectedId) ?? null;

  // --- rich-text editing using contentEditable ---
  const exec = (command: string, value?: string) => {
    document.execCommand(command, false, value);
  };

  // Remove selected image from rich text editor
  const removeSelectedImage = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      
      // Find the image element
      let imgElement: HTMLImageElement | null = null;
      if (container.nodeType === Node.ELEMENT_NODE) {
        const element = container as Element;
        imgElement = element.querySelector('img') || (element.tagName === 'IMG' ? element as HTMLImageElement : null);
      } else if (container.parentElement) {
        imgElement = container.parentElement.querySelector('img');
      }
      
      if (imgElement) {
        imgElement.remove();
        // Update chapter content
        const editorElement = document.getElementById('content-editor');
        if (editorElement && current) {
          updateChapter({ content: editorElement.innerHTML });
        }
      }
    }
  };

  const StoryEditor = (
    <div className="flex flex-col md:flex-row h-full">
      {/* Sidebar */}
      <aside className="w-full md:w-56 shrink-0 border-r border-gray-600 p-4 overflow-y-auto bg-gray-900/40">
        <button
          onClick={addChapter}
          className="w-full mb-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 rounded text-white"
        >
          + New Chapter
        </button>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={chapters.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            {chapters.map((chapter) => (
              <div
                key={chapter.id}
                onClick={() => setSelectedId(chapter.id)}
                className={clsx(
                  "cursor-pointer p-2 rounded mb-2 text-sm truncate",
                  selectedId === chapter.id
                    ? "bg-emerald-700 text-white"
                    : "bg-gray-700/40 text-gray-200 hover:bg-gray-600/60"
                )}
              >
                {chapter.title || "(untitled)"}
              </div>
            ))}
          </SortableContext>
        </DndContext>
      </aside>

      {/* Editor / Preview */}
      <section className="flex-1 flex flex-col h-full">
        {/* Toolbar */}
        {current && !preview && (
          <div className="flex gap-2 border-b border-gray-700 bg-gray-800 p-2 overflow-x-auto">
            <button onClick={() => exec("bold")} className="px-2 py-1 text-xs hover:bg-gray-700 rounded">
              B
            </button>
            <button onClick={() => exec("italic")} className="px-2 py-1 text-xs hover:bg-gray-700 rounded">
              I
            </button>
            <button onClick={() => exec("underline")} className="px-2 py-1 text-xs hover:bg-gray-700 rounded">
              U
            </button>
            <button onClick={() => exec("insertOrderedList")} className="px-2 py-1 text-xs hover:bg-gray-700 rounded">
              OL
            </button>
            <button onClick={() => exec("insertUnorderedList")} className="px-2 py-1 text-xs hover:bg-gray-700 rounded">
              UL
            </button>
            <label className="px-2 py-1 text-xs hover:bg-gray-700 rounded cursor-pointer" title="Insert image">
              <ImageIcon className="h-4 w-4" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    try {
                      const { data: sessionData } = await supabase.auth.getSession();
                      const token = sessionData.session?.access_token;
                      const formData = new FormData();
                      formData.append('file', file);
                      formData.append('folder', 'story-content');

                      const resp = await fetch('/api/upload/file', {
                        method: 'POST',
                        headers: token ? { Authorization: `Bearer ${token}` } : {},
                        body: formData,
                      });
                      if (!resp.ok) throw new Error('Upload failed');
                      const json = await resp.json();
                      exec("insertImage", json.url);
                    } catch (error) {
                      console.error('Image upload failed:', error);
                      alert('Failed to upload image. Please try again.');
                    }
                  }
                }}
              />
            </label>
            <button 
              onClick={removeSelectedImage} 
              className="px-2 py-1 text-xs hover:bg-red-700 rounded text-red-400 hover:text-white"
              title="Remove selected image"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button className="ml-auto text-xs" onClick={() => setPreview((p) => !p)}>
              {preview ? "Edit" : "Preview"}
            </button>
          </div>
        )}

        {/* Title input */}
        {current && !preview && (
          <input
            value={current.title}
            onChange={(e) => updateChapter({ title: e.target.value })}
            placeholder="Chapter title"
            className="w-full px-4 py-2 text-2xl font-semibold bg-transparent border-b border-gray-700 focus:outline-none"
          />
        )}

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-4 prose dark:prose-invert max-w-none bg-gray-900/20">
          {current ? (
            preview ? (
              <article dangerouslySetInnerHTML={{ __html: current.content }} />
            ) : (
              <div
                contentEditable
                suppressContentEditableWarning
                id="content-editor"
                className="flex-1 p-4 bg-gray-800/50 text-gray-100 resize-none focus:outline-none overflow-y-auto"
                onInput={(e) => updateChapter({ content: (e.target as HTMLElement).innerHTML })}
                dangerouslySetInnerHTML={{ __html: current.content }}
              />
            )
          ) : (
            <p className="text-gray-400">Select or create a chapter to begin.</p>
          )}
        </div>
      </section>
    </div>
  );

  // --- comic editor stub ---
  const ComicEditor = (
    <div className="p-4 text-center text-gray-300">
      <p className="mb-4">🖌️ Comic editor coming soon! (drag panels, add speech bubbles, etc.)</p>
      <p>
        For now, this is a placeholder demonstrating the tab system and local-storage persistence.
      </p>
    </div>
  );

  // --- photo story maker ---
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  const uploadPhotoImage = async (file: File): Promise<string> => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'photo-stories');

    const resp = await fetch('/api/upload/file', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!resp.ok) throw new Error('Upload failed');
    const json = await resp.json();
    return json.url as string;
  };

  // Delete photo function
  const deletePhoto = () => {
    setPhotoUrl("");
  };

  const PhotoStoryMaker = (
    <div className="p-6 flex flex-col gap-6 max-w-3xl mx-auto">
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-200">Upload Photo</label>
        {photoUrl ? (
          <div className="relative group">
            <img src={photoUrl} alt="story visual" className="w-full max-h-96 object-cover rounded" />
            <button
              onClick={deletePhoto}
              className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              title="Delete photo"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-500 rounded p-8 text-center cursor-pointer hover:border-emerald-500" onClick={() => document.getElementById('photo-input')?.click()}>
            {uploadingPhoto ? "Uploading…" : "Click to upload"}
          </div>
        )}
        <input id="photo-input" type="file" accept="image/*" className="hidden" onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) {
            setUploadingPhoto(true);
            try {
              const url = await uploadPhotoImage(f);
              setPhotoUrl(url);
            } catch (error) {
              console.error('Photo upload failed:', error);
              alert('Failed to upload photo. Please try again.');
            } finally {
              setUploadingPhoto(false);
            }
          }
        }} />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-200">Story Text</label>
        <textarea
          className="w-full h-60 p-4 rounded bg-gray-800 text-gray-100 resize-y focus:outline-none"
          placeholder="Write your story here…"
          value={photoText}
          onChange={(e) => setPhotoText(e.target.value)}
        />
      </div>

      {photoUrl && (
        <div className="bg-amber-50/5 p-6 rounded shadow-inner space-y-4">
          <div className="relative group">
            <img src={photoUrl} alt="preview" className="w-full max-h-96 object-cover rounded" />
            <button
              onClick={deletePhoto}
              className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              title="Delete photo"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <p className="whitespace-pre-wrap leading-relaxed font-cormorant text-lg text-amber-50/90">{photoText}</p>
        </div>
      )}
    </div>
  );

  // --- cover designer stub ---
  const [cover, setCover] = useState({
    title: "My Awesome Story",
    subtitle: "",
    bg: "#1e293b",
    image: "", // Add cover image support
  });

  // Upload cover image
  const [uploadingCover, setUploadingCover] = useState(false);
  
  const uploadCoverImage = async (file: File): Promise<string> => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'covers');

    const resp = await fetch('/api/upload/file', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!resp.ok) throw new Error('Upload failed');
    const json = await resp.json();
    return json.url as string;
  };

  // Delete cover image
  const deleteCoverImage = () => {
    setCover(prev => ({ ...prev, image: "" }));
  };

  const CoverDesigner = (
    <div className="flex flex-col md:flex-row gap-6 p-4">
      <div className="md:w-1/3 space-y-4">
        <input
          className="w-full p-2 rounded bg-gray-700 text-white"
          placeholder="Title"
          value={cover.title}
          onChange={(e) => setCover({ ...cover, title: e.target.value })}
        />
        <input
          className="w-full p-2 rounded bg-gray-700 text-white"
          placeholder="Subtitle / Author"
          value={cover.subtitle}
          onChange={(e) => setCover({ ...cover, subtitle: e.target.value })}
        />
        <input
          type="color"
          className="w-full h-10 p-1"
          value={cover.bg}
          onChange={(e) => setCover({ ...cover, bg: e.target.value })}
        />
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-200">Cover Image</label>
          {cover.image ? (
            <div className="relative group">
              <img src={cover.image} alt="Cover" className="w-full h-32 object-cover rounded" />
              <button
                onClick={deleteCoverImage}
                className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                title="Delete cover image"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div 
              className="border-2 border-dashed border-gray-500 rounded p-4 text-center cursor-pointer hover:border-emerald-500 text-sm"
              onClick={() => document.getElementById('cover-input')?.click()}
            >
              {uploadingCover ? "Uploading..." : "Click to upload cover image"}
            </div>
          )}
          <input 
            id="cover-input" 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) {
                setUploadingCover(true);
                try {
                  const url = await uploadCoverImage(f);
                  setCover(prev => ({ ...prev, image: url }));
                } catch (error) {
                  console.error('Cover upload failed:', error);
                  alert('Failed to upload cover image. Please try again.');
                } finally {
                  setUploadingCover(false);
                }
              }
            }} 
          />
        </div>
      </div>
      <div className="flex-1 flex justify-center items-center">
        <div
          className="w-60 h-80 shadow-inner flex flex-col justify-center items-center text-center px-4 relative overflow-hidden"
          style={{ background: cover.bg }}
        >
          {cover.image && (
            <img 
              src={cover.image} 
              alt="Cover background" 
              className="absolute inset-0 w-full h-full object-cover opacity-50" 
            />
          )}
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white truncate max-w-full drop-shadow-lg">
              {cover.title}
            </h2>
            <p className="text-sm text-white/80 mt-2 drop-shadow">{cover.subtitle}</p>
          </div>
        </div>
      </div>
    </div>
  );

  // --- export stub ---
  const ExportPanel = (
    <div className="p-6 space-y-4 text-center text-gray-200">
      <button
        className="px-4 py-2 bg-emerald-600 rounded hover:bg-emerald-700"
        onClick={() => window.open("/preview.html", "_blank")}
      >
        Export as PDF (mock)
      </button>
      <button
        className="px-4 py-2 bg-indigo-600 rounded hover:bg-indigo-700"
        onClick={() => window.open("data:text/html," + encodeURIComponent(current?.content || ""), "_blank")}
      >
        Export as Web Story
      </button>
      <button
        className="px-4 py-2 bg-yellow-600 rounded hover:bg-yellow-700"
        onClick={() => alert("Pretend publishing …")}
      >
        Publish (mock)
      </button>
    </div>
  );

  // --- profile stub ---
  const Profile = (
    <div className="p-6 text-gray-200 space-y-4 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold">Demo User</h2>
      <p>Total projects: 1</p>
      <p>Drafts: 1 • Published: 0 • Views: 123 • Likes: 45</p>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-gray-100">
      <Helmet>
        <title>TaleCraft Editor</title>
      </Helmet>
      {/* Tabs */}
      <nav className="flex gap-4 p-4 border-b border-gray-700 overflow-x-auto text-sm md:text-base">
        {[
          ["story", "✏️ Story"],
          ["photo", "🖼️ Photo Story"],
          ["comic", "🎨 Comic"],
          ["cover", "📘 Cover"],
          ["export", "📤 Export"],
          ["profile", "👤 Profile"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key as Tab)}
            className={clsx(
              "px-3 py-1 rounded",
              tab === key ? "bg-emerald-600 text-white" : "hover:bg-gray-700/50"
            )}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {tab === "story" && StoryEditor}
        {tab === "comic" && ComicEditor}
        {tab === "photo" && PhotoStoryMaker}
        {tab === "cover" && CoverDesigner}
        {tab === "export" && ExportPanel}
        {tab === "profile" && Profile}
      </div>
    </div>
  );
}

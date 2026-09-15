import React, { FormEvent, useMemo, useState } from 'react';
import { LoaderCircle, MessageSquare, Pencil, Send, Trash2, X } from 'lucide-react';
import { ProjectComment } from '../types';

interface CommentsPanelProps {
  comments: ProjectComment[];
  currentUserId?: string;
  isLoading: boolean;
  onClose: () => void;
  onSave: (body: string) => Promise<boolean>;
  onDelete: (commentId: string) => Promise<boolean>;
}

const MAX_COMMENT_LENGTH = 500;

function formatCommentDate(value: unknown) {
  const date = value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function'
    ? value.toDate()
    : value instanceof Date ? value : null;
  if (!date || Number.isNaN(date.getTime())) return '방금 전';
  return new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
}

export const CommentsPanel: React.FC<CommentsPanelProps> = ({
  comments,
  currentUserId,
  isLoading,
  onClose,
  onSave,
  onDelete,
}) => {
  const ownComment = useMemo(() => comments.find(comment => comment.id === currentUserId), [comments, currentUserId]);
  const [draft, setDraft] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openEditor = () => {
    setDraft(ownComment?.body || '');
    setIsEditing(true);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (await onSave(draft)) {
        setDraft('');
        setIsEditing(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!ownComment || isSubmitting || !window.confirm('내 댓글을 삭제할까요?')) return;
    setIsSubmitting(true);
    try {
      if (await onDelete(ownComment.id)) {
        setDraft('');
        setIsEditing(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="flex-1 min-h-0 bg-[#f8f9ff] flex flex-col" aria-labelledby="comments-heading">
      <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <MessageSquare className="w-4 h-4 text-[#3525cd]" />
          <h2 id="comments-heading" className="text-sm font-extrabold text-[#0b1c30]">댓글 {comments.length}개</h2>
          <span className="text-[11px] text-[#464555] truncate">한 작품에 댓글 하나를 남길 수 있어요.</span>
        </div>
        <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 text-[#0b1c30] hover:bg-slate-200 flex items-center justify-center" aria-label="댓글 닫기">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3">
        {isLoading ? (
          <div className="py-10 flex justify-center text-[#3525cd]" aria-label="댓글 불러오는 중"><LoaderCircle className="w-5 h-5 animate-spin" /></div>
        ) : comments.length === 0 ? (
          <div className="py-10 text-center rounded-2xl bg-white border border-slate-200">
            <MessageSquare className="w-7 h-7 mx-auto text-[#3525cd]" />
            <p className="mt-2 text-sm font-bold text-[#0b1c30]">첫 번째 응원 댓글을 남겨보세요</p>
            <p className="mt-1 text-xs text-[#464555]">서로의 작품을 따뜻하게 응원해 주세요.</p>
          </div>
        ) : (
          <ol className="space-y-2.5">
            {comments.map(comment => {
              const isOwn = comment.id === currentUserId;
              return (
                <li key={comment.id} className={`rounded-2xl border p-3 ${isOwn ? 'bg-[#eff4ff] border-[#d3e4fe]' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-start gap-2.5">
                    {comment.authorPhotoUrl ? (
                      <img src={comment.authorPhotoUrl} alt="" className="w-8 h-8 rounded-full object-cover bg-slate-100" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="w-8 h-8 rounded-full bg-[#3525cd] text-white flex items-center justify-center text-xs font-bold" aria-hidden="true">{comment.authorName.slice(0, 1)}</span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-extrabold text-[#0b1c30] truncate">{comment.authorName}</span>
                        {isOwn && <span className="px-1.5 py-0.5 rounded bg-[#dce9ff] text-[10px] font-bold text-[#3525cd]">내 댓글</span>}
                        <time className="ml-auto text-[10px] text-[#464555] whitespace-nowrap">{formatCommentDate(comment.updatedAt || comment.createdAt)}</time>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-[#30303d] whitespace-pre-wrap break-words select-text">{comment.body}</p>
                      {isOwn && <div className="mt-2 flex gap-1.5">
                        <button type="button" onClick={openEditor} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold text-[#3525cd] bg-white border border-[#d3e4fe] hover:bg-[#e5eeff]">
                          <Pencil className="w-3 h-3" /> 수정
                        </button>
                        <button type="button" onClick={() => void handleDelete()} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold text-rose-700 bg-white border border-rose-100 hover:bg-rose-50">
                          <Trash2 className="w-3 h-3" /> 삭제
                        </button>
                      </div>}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {(!ownComment || isEditing) && (
        <form onSubmit={event => void handleSubmit(event)} className="p-3 bg-white border-t border-slate-100">
          <label htmlFor="comment-draft" className="sr-only">댓글 내용</label>
          <textarea
            id="comment-draft"
            value={draft}
            onChange={event => setDraft(event.target.value.slice(0, MAX_COMMENT_LENGTH))}
            maxLength={MAX_COMMENT_LENGTH}
            rows={3}
            placeholder={currentUserId ? '작품을 응원하는 댓글을 남겨주세요.' : '로그인 후 댓글을 남길 수 있어요.'}
            className="w-full resize-none rounded-xl border border-slate-200 bg-[#f8f9ff] px-3 py-2 text-sm text-[#0b1c30] placeholder:text-slate-400 outline-none focus:border-[#3525cd] focus:ring-2 focus:ring-[#dce9ff]"
            aria-describedby="comment-length"
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <span id="comment-length" className="text-[11px] text-[#464555]">{draft.length}/{MAX_COMMENT_LENGTH}</span>
            <div className="flex items-center gap-2">
              {isEditing && <button type="button" onClick={() => { setDraft(''); setIsEditing(false); }} className="px-2 py-1.5 text-xs font-bold text-[#464555]">취소</button>}
              <button type="submit" disabled={!draft.trim() || isSubmitting} className="inline-flex items-center gap-1.5 rounded-xl bg-[#3525cd] px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#281ca3] disabled:cursor-not-allowed disabled:opacity-50">
                {isSubmitting ? <LoaderCircle className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                {isEditing ? '수정 저장' : currentUserId ? '댓글 등록' : '로그인 후 등록'}
              </button>
            </div>
          </div>
        </form>
      )}
    </section>
  );
};

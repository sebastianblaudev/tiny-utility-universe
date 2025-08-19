// Utility functions for receipt configuration

export const getDefaultPaperWidth = (): '58mm' | '80mm' => {
  const saved = localStorage.getItem('receipt_paper_width') as '58mm' | '80mm';
  return saved || '80mm';
};

export const setDefaultPaperWidth = (width: '58mm' | '80mm') => {
  localStorage.setItem('receipt_paper_width', width);
};
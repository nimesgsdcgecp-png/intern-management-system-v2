import Swal from 'sweetalert2';

export const showToast = (title: string, icon: 'success' | 'error' | 'warning' | 'info' = 'success') => {
  const bgColors = {
    success: '#10b981', // Emerald 500
    error: '#ef4444',   // Rose 500
    warning: '#f59e0b', // Amber 500
    info: '#3b82f6'     // Blue 500
  };

  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer)
      toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
  });

  Toast.fire({
    icon,
    title,
    background: bgColors[icon] || '#ffffff',
    color: '#ffffff',
    iconColor: '#ffffff',
    customClass: {
      popup: 'rounded-2xl shadow-2xl border-none font-bold',
    }
  });
};

export const showAlert = async (title: string, text: string, icon: 'success' | 'error' | 'warning' | 'info' = 'info') => {

  return Swal.fire({
    title,
    text,
    icon,
    confirmButtonColor: '#6366f1',
    cancelButtonColor: '#f43f5e',
    confirmButtonText: 'Understood',
    background: '#ffffff',
    color: '#1e293b',
    customClass: {
      popup: 'rounded-[2.5rem] p-8 border-4 border-slate-50',
      confirmButton: 'rounded-xl px-8 py-3.5 font-bold shadow-lg shadow-indigo-200 hover:scale-105 transition-transform',
      cancelButton: 'rounded-xl px-8 py-3.5 font-bold',
    }
  });
};

export const showConfirm = async (title: string, text: string) => {
  return Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#6366f1',
    cancelButtonColor: '#94a3b8',
    confirmButtonText: 'Yes, proceed',
    background: '#ffffff',
    color: '#1e293b',
    customClass: {
      popup: 'rounded-[2.5rem] p-8 border-4 border-slate-50',
      confirmButton: 'rounded-xl px-8 py-3.5 font-bold shadow-lg shadow-indigo-200',
      cancelButton: 'rounded-xl px-8 py-3.5 font-bold',
    }
  });
};

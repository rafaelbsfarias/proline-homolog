// Debug script para verificar estado da autenticação
console.log('=== DEBUG AUTH STATE ===');

// Verificar localStorage
console.log('localStorage keys:', Object.keys(localStorage));
console.log(
  'localStorage sb-* keys:',
  Object.keys(localStorage).filter(key => key.startsWith('sb-'))
);

// Verificar sessionStorage
console.log('sessionStorage keys:', Object.keys(sessionStorage));

// Verificar cookies
console.log('Cookies:', document.cookie);

// Verificar se há sessão no Supabase
import { supabase } from '@/modules/common/services/supabaseClient';

supabase.auth.getSession().then(({ data, error }) => {
  console.log('Supabase session:', data.session);
  console.log('Supabase session error:', error);

  if (data.session) {
    console.log('Access token exists:', !!data.session.access_token);
    if (data.session.expires_at) {
      console.log('Token expires at:', new Date(data.session.expires_at * 1000));
      console.log('Token expired:', data.session.expires_at * 1000 < Date.now());
    }
  }
});

supabase.auth.getUser().then(({ data, error }) => {
  console.log('Supabase user:', data.user);
  console.log('Supabase user error:', error);
});

console.log('=== END DEBUG ===');

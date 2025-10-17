#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function getPartnerToken() {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'mecanica@parceiro.com',
      password: '123qwe',
    });

    if (error) {
      console.error('Erro ao fazer login:', error.message);
      process.exit(1);
    }

    console.log('✅ Login realizado com sucesso!');
    console.log('Access Token:', data.session.access_token);
    console.log('\nUser ID:', data.user.id);
    console.log('Email:', data.user.email);
    console.log('Role:', data.user.user_metadata.role);

  } catch (err) {
    console.error('Erro:', err);
    process.exit(1);
  }
}

getPartnerToken();
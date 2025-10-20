#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testMustChangePassword() {
  console.log('🔍 Testando se must_change_password está sendo definido corretamente...\n');

  try {
    // Buscar os últimos perfis criados
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, must_change_password, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Erro ao buscar perfis:', error.message);
      return;
    }

    console.log('📋 Últimos 10 perfis criados:');
    console.log('─'.repeat(80));

    profiles.forEach((profile, index) => {
      const createdAt = new Date(profile.created_at).toLocaleString('pt-BR');
      const mustChange = profile.must_change_password ? '✅ TRUE' : '❌ FALSE';

      console.log(`${index + 1}. ${profile.full_name}`);
      console.log(`   Role: ${profile.role}`);
      console.log(`   Must Change Password: ${mustChange}`);
      console.log(`   Criado em: ${createdAt}`);
      console.log('');
    });

    // Verificar especificamente usuários criados recentemente (últimas 24h)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const recentProfiles = profiles.filter(p => new Date(p.created_at) > yesterday);

    console.log('📊 Análise dos usuários criados nas últimas 24h:');
    console.log('─'.repeat(50));

    const byRole = {};
    recentProfiles.forEach(profile => {
      if (!byRole[profile.role]) {
        byRole[profile.role] = [];
      }
      byRole[profile.role].push(profile);
    });

    Object.keys(byRole).forEach(role => {
      const roleProfiles = byRole[role];
      const withMustChange = roleProfiles.filter(p => p.must_change_password).length;
      const total = roleProfiles.length;

      console.log(`${role}: ${withMustChange}/${total} têm must_change_password = true`);

      if (withMustChange !== total) {
        console.log(`⚠️  ALERTA: Nem todos os usuários ${role} têm must_change_password = true!`);
      }
    });

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

testMustChangePassword();
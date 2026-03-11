#!/usr/bin/env node

import { spawn, execSync } from 'child_process';
import { platform } from 'os';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Load .env file manually
function loadEnvFile() {
  try {
    // In Docker, prefer .env.docker if it exists
    const isDocker = process.env.DOCKER_ENV === 'true' || process.env.NODE_ENV === 'docker';
    const envPath = isDocker && existsSync(resolve(process.cwd(), '.env.docker'))
      ? resolve(process.cwd(), '.env.docker')
      : resolve(process.cwd(), '.env');
    
    const envContent = readFileSync(envPath, 'utf-8');
    
    const envVars = {};
    envContent.split('\n').forEach(line => {
      line = line.trim();
      // Skip empty lines and comments
      if (!line || line.startsWith('#')) return;
      
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').trim();
      
      if (key) {
        envVars[key] = value;
      }
    });
    
    console.log(`✅ Loaded ${envPath.includes('.env.docker') ? '.env.docker' : '.env'} file`);
    return envVars;
  } catch (error) {
    console.log('⚠️  No .env file found, using defaults');
    return {};
  }
}

// Load environment variables from .env
const envFromFile = loadEnvFile();

// Function to check if a command exists
function commandExists(command) {
  try {
    execSync(`${command} --version`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Function to start the backend with the best available runtime
function startBackend() {
  console.log('🚀 Starting backend server...');
  
  let command, args;
  
  // Check for bun first (preferred)
  if (commandExists('bun')) {
    console.log('✅ Using Bun runtime');
    command = 'bun';
    args = ['--watch', 'src/server/index.ts'];
  }
  // Fallback to Node.js with tsx for TypeScript support
  else if (commandExists('npx')) {
    console.log('✅ Using Node.js with tsx runtime');
    command = 'npx';
    args = ['tsx', '--watch', 'src/server/index.node.ts'];
  }
  else if (commandExists('node')) {
    console.log('⚠️  Using Node.js runtime (TypeScript compilation required)');
    command = 'node';
    args = ['--watch', 'src/server/index.node.ts'];
  }
  else {
    console.error('❌ Neither Bun nor Node.js found in PATH');
    process.exit(1);
  }

  // Set environment variables - .env file takes precedence over system env
  const env = {
    ...process.env,
    ...envFromFile, // Override with .env file values
  };
  
  // Ensure PORT is set
  if (!env.PORT) {
    env.PORT = '3000';
  }
  
  console.log(`✅ Using PORT=${env.PORT}`);
  env.NODE_ENV = env.NODE_ENV || 'development';

  // Spawn the process
  const child = spawn(command, args, {
    stdio: 'inherit',
    env,
    shell: platform() === 'win32'
  });

  // Handle process events
  child.on('error', (error) => {
    console.error('❌ Failed to start backend:', error.message);
    process.exit(1);
  });

  child.on('exit', (code) => {
    if (code !== 0) {
      console.error(`❌ Backend exited with code ${code}`);
      process.exit(code);
    }
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down backend...');
    child.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down backend...');
    child.kill('SIGTERM');
  });
}

startBackend();
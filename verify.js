#!/usr/bin/env node

/**
 * Quick Verification Script - Leave Management System
 * Tests connectivity and configuration before startup
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[36m';

function print(msg, color = RESET) {
  console.log(`${color}${msg}${RESET}`);
}

function checkFile(filePath, name) {
  const exists = fs.existsSync(filePath);
  if (exists) {
    print(`✅ ${name} exists`, GREEN);
    return true;
  } else {
    print(`❌ ${name} not found: ${filePath}`, RED);
    return false;
  }
}

function checkEnv(filePath, name) {
  if (!fs.existsSync(filePath)) {
    print(`⚠️  ${name} not found (will use defaults)`, YELLOW);
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  print(`✅ ${name} found`, GREEN);
  
  if (filePath.includes('backend')) {
    if (content.includes('MONGO_URI') && !content.includes('mongodb://')) {
      print(`   ⚠️  MONGO_URI not properly configured`, YELLOW);
      return false;
    }
  }
  
  return true;
}

function testConnection(host, port, name, timeout = 5000) {
  return new Promise((resolve) => {
    const requestOptions = {
      host,
      port,
      method: 'HEAD',
      timeout,
    };

    const req = http.request(requestOptions, (res) => {
      print(`✅ ${name} is reachable (${host}:${port})`, GREEN);
      resolve(true);
    });

    req.on('error', (err) => {
      if (err.code === 'ECONNREFUSED') {
        print(`❌ ${name} not running (${host}:${port})`, RED);
      } else if (err.code === 'ETIMEDOUT') {
        print(`❌ ${name} timeout (${host}:${port})`, RED);
      } else {
        print(`❌ ${name} error: ${err.message}`, RED);
      }
      resolve(false);
    });

    req.on('timeout', () => {
      print(`❌ ${name} timeout (${host}:${port})`, RED);
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function verifySetup() {
  print('\n🔍 Leave Management System - Verification\n', BLUE);

  // Check directory structure
  print('📁 Checking directory structure...', BLUE);
  checkFile(path.join(__dirname, 'backend', 'server.js'), 'Backend server.js');
  checkFile(path.join(__dirname, 'frontend', 'vite.config.js'), 'Frontend vite.config.js');
  checkFile(path.join(__dirname, 'backend', 'package.json'), 'Backend package.json');
  checkFile(path.join(__dirname, 'frontend', 'package.json'), 'Frontend package.json');

  // Check environment files
  print('\n📋 Checking environment files...', BLUE);
  checkEnv(path.join(__dirname, 'backend', '.env'), 'Backend .env');
  checkEnv(path.join(__dirname, 'frontend', '.env.local'), 'Frontend .env.local');

  // Check node_modules
  print('\n📦 Checking dependencies...', BLUE);
  const backendModules = fs.existsSync(path.join(__dirname, 'backend', 'node_modules'));
  if (backendModules) {
    print('✅ Backend dependencies installed', GREEN);
  } else {
    print('❌ Backend dependencies not installed. Run: cd backend && npm install', RED);
  }

  const frontendModules = fs.existsSync(path.join(__dirname, 'frontend', 'node_modules'));
  if (frontendModules) {
    print('✅ Frontend dependencies installed', GREEN);
  } else {
    print('❌ Frontend dependencies not installed. Run: cd frontend && npm install', RED);
  }

  // Test connections
  print('\n🌐 Testing connections...', BLUE);
  const backendRunning = await testConnection('localhost', 5000, 'Backend Server');
  const frontendRunning = await testConnection('localhost', 5173, 'Frontend Server');

  // Results
  print('\n📊 Summary:', BLUE);
  if (backendRunning && frontendRunning) {
    print('✅ Both servers are running and ready!', GREEN);
  } else if (!backendRunning && frontendRunning) {
    print('⚠️  Frontend is running but backend is not started', YELLOW);
    print('   Start backend: cd backend && npm run dev', YELLOW);
  } else if (backendRunning && !frontendRunning) {
    print('⚠️  Backend is running but frontend is not started', YELLOW);
    print('   Start frontend: cd frontend && npm run dev', YELLOW);
  } else {
    print('❌ Both servers need to be started', RED);
    print('   Terminal 1: cd backend && npm run dev', RED);
    print('   Terminal 2: cd frontend && npm run dev', RED);
  }

  print('\n💡 For detailed setup instructions, see STARTUP_GUIDE.md\n', BLUE);
}

verifySetup().catch((err) => {
  print(`Error during verification: ${err.message}`, RED);
  process.exit(1);
});

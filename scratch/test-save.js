async function run() {
  try {
    // 1. Log in to get a token
    const loginRes = await fetch('http://localhost:3001/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@unerp.dev',
        password: 'admin123',
        tenantSlug: 'system'
      })
    });
    
    if (!loginRes.ok) {
      console.error('Login failed:', await loginRes.text());
      return;
    }
    
    const { token } = await loginRes.json();
    console.log('Login successful. Token acquired.');

    // 2. Perform the PATCH request
    const patchRes = await fetch('http://localhost:3001/api/v1/auth/me', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        firstName: 'Syste',
        lastName: 'Administrator',
        preferences: {
          language: 'English (US)',
          theme: 'System Default'
        }
      })
    });

    console.log('Response Status:', patchRes.status);
    const result = await patchRes.json();
    console.log('Response Body:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('Error running test script:', error);
  }
}

run();

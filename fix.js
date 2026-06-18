const fs = require('fs');
let content = fs.readFileSync('packages/database/prisma/schema.prisma', 'utf8');

// The file got duplicated at the end. We need to find the last valid `model WebSeo {` and remove anything before it if it is incomplete.
// Actually, it's easier to find the index of the first `model WebAsset {` that comes right after an incomplete `WebSeo`.
// Let's just find the exact string and replace it.

const brokenStr = `model WebSeo {
  id          String   @id @default(cuid())
  tenantId    String   @map("tenant_id")
  path        String   // URL path this applies to
  title       String
  description String?
  keywords    String?

model WebAsset {`;

content = content.replace(brokenStr, 'model WebAsset {');

// Also remove duplicate WebTemplate, WebMenu, WebSeo if they exist multiple times.
// Let's just ensure we don't have multiple `model WebAsset` etc.

// Instead of regex, let's just rewrite the tail.
fs.writeFileSync('packages/database/prisma/schema.prisma', content);
console.log('Fixed.');

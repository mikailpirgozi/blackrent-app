#!/bin/bash
# Fix Button size prop (remove it - not supported in shadcn)
find src -name "*.tsx" -type f -exec sed -i '' 's/size=["'\'']small["'\'']/className="h-8 px-3 text-sm"/g' {} \;
find src -name "*.tsx" -type f -exec sed -i '' 's/size=["'\'']large["'\'']/className="h-12 px-8 text-base"/g' {} \;
find src -name "*.tsx" -type f -exec sed -i '' 's/size=["'\'']medium["'\'']/className="h-10 px-4"/g' {} \;
find src -name "*.tsx" -type f -exec sed -i '' 's/size={["'\'']small["'\'']/className="h-8 px-3 text-sm"/g' {} \;
find src -name "*.tsx" -type f -exec sed -i '' 's/size={["'\'']large["'\'']/className="h-12 px-8 text-base"/g' {} \;
find src -name "*.tsx" -type f -exec sed -i '' 's/size={["'\'']medium["'\'']/className="h-10 px-4"/g' {} \;

# Fix Badge variant prop (map MUI variants to shadcn)
find src -name "*.tsx" -type f -exec sed -i '' 's/variant=["'\'']outlined["'\'']/variant="outline"/g' {} \;
find src -name "*.tsx" -type f -exec sed -i '' 's/variant=["'\'']filled["'\'']/variant="default"/g' {} \;

# Fix Button variant prop (map MUI variants to shadcn)
# Note: contained -> default, outlined -> outline, text -> ghost
find src -name "*.tsx" -type f -exec sed -i '' 's/variant=["'\'']contained["'\'']/variant="default"/g' {} \;
find src -name "*.tsx" -type f -exec sed -i '' 's/variant=["'\'']outlined["'\'']/variant="outline"/g' {} \;
find src -name "*.tsx" -type f -exec sed -i '' 's/variant=["'\'']text["'\'']/variant="ghost"/g' {} \;

echo "✅ Fixed Button and Badge props"

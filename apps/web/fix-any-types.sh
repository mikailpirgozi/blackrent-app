#!/bin/bash
# Fix implicit any types in common patterns

# Fix: onValueChange={value => ... to onValueChange={(value: string) => ...
find src -name "*.tsx" -type f -exec sed -i '' 's/onValueChange={value =>/onValueChange={(value: string) =>/g' {} \;
find src -name "*.tsx" -type f -exec sed -i '' 's/onValueChange={ value =>/onValueChange={(value: string) =>/g' {} \;

# Fix: onCheckedChange={checked => ... to onCheckedChange={(checked: boolean) => ...
find src -name "*.tsx" -type f -exec sed -i '' 's/onCheckedChange={checked =>/onCheckedChange={(checked: boolean) =>/g' {} \;
find src -name "*.tsx" -type f -exec sed -i '' 's/onCheckedChange={ checked =>/onCheckedChange={(checked: boolean) =>/g' {} \;

# Fix: onOpenChange={open => ... to onOpenChange={(open: boolean) => ...
find src -name "*.tsx" -type f -exec sed -i '' 's/onOpenChange={open =>/onOpenChange={(open: boolean) =>/g' {} \;
find src -name "*.tsx" -type f -exec sed -i '' 's/onOpenChange={ open =>/onOpenChange={(open: boolean) =>/g' {} \;

# Fix: onChange={e => ... to onChange={(e: React.ChangeEvent<HTMLInputElement>) => ...
# (only for simple cases without other params)
find src -name "*.tsx" -type f -exec sed -i '' 's/onChange={e =>/onChange={(e: React.ChangeEvent<HTMLInputElement>) =>/g' {} \;

# Fix: onSelect={date => ... to onSelect={(date: Date | undefined) => ...
find src -name "*.tsx" -type f -exec sed -i '' 's/onSelect={date =>/onSelect={(date: Date | undefined) =>/g' {} \;

echo "✅ Fixed implicit any types"

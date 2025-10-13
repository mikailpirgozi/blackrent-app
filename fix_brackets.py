#!/usr/bin/env python3
"""
Fix all };  to  });  after reply.send({ blocks
"""
import re
from pathlib import Path

def fix_file(filepath):
    """Fix closing brackets in a file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find all reply.send({ blocks and fix their closing };
    # Pattern: reply.send({  ...any content...  };
    lines = content.split('\n')
    modified = False
    
    in_reply_send = False
    bracket_depth = 0
    
    for i, line in enumerate(lines):
        # Check if we're entering a reply.send({ block
        if 'reply.send({' in line or 'return reply.send({' in line:
            in_reply_send = True
            bracket_depth = line.count('{') - line.count('}')
        
        # Track bracket depth
        if in_reply_send:
            bracket_depth += line.count('{') - line.count('}')
            
            # If we hit bracket_depth == 0 and line ends with };
            if bracket_depth == 0 and line.rstrip().endswith('};'):
                lines[i] = line.replace('};', '});')
                modified = True
                in_reply_send = False
    
    if modified:
        new_content = '\n'.join(lines)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"✅ Fixed: {filepath.name}")
        return True
    return False

def main():
    routes_dir = Path("/Users/mikailpirgozi/Desktop/Aplikacie Cursor/Blackrent Beta 2/backend/src/fastify/routes")
    
    # Get all TypeScript files with errors
    problem_files = [
        'admin.ts', 'auth.ts', 'availability.ts', 'bulk.ts', 'cleanup-routes.ts',
        'companies.ts', 'company-investors.ts', 'customers.ts', 'debug.ts',
        'email-routes-all.ts', 'expense-categories.ts', 'expenses.ts', 'files.ts',
        'insurances.ts', 'insurers.ts', 'leasings.ts', 'permissions-routes.ts',
        'platforms.ts', 'recurring-expenses.ts'
    ]
    
    fixed_count = 0
    for filename in problem_files:
        filepath = routes_dir / filename
        if filepath.exists():
            if fix_file(filepath):
                fixed_count += 1
    
    print(f"\n🎉 Fixed {fixed_count}/{len(problem_files)} files")

if __name__ == "__main__":
    main()


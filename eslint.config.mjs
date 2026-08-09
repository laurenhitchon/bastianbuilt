import nswds from '@nswds/eslint-config'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([...nswds, globalIgnores(['scripts/**'])])

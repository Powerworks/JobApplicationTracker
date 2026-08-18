# Contract: SubmitApplication (updated)

Supersedes the `SubmitApplication` entry in feature 001's `contracts/commands.md` for this field
shape only — preconditions and rejections are unchanged (still none; see feature 001).

## SubmitApplication

- **Input**:
  ```text
  {
    company: string
    role: string
    location: string
    salary?: { amount: number, currency: string }
    employmentType: "Permanent" | "Contract"
    bonus?: { amount: number, currency: string }
    benefits: string[]
  }
  ```
- **Precondition**: None (creates a new stream) — unchanged from feature 001.
- **On success**: `ApplicationSubmitted` carrying all fields above, unchanged in shape from the
  command's `data`.
- **Rejections**: none defined at this layer — unchanged from feature 001. `salary` and `bonus`
  being absent is valid input, not a rejection (FR-002, FR-004).

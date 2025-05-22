"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import type { UserData } from "@/lib/user-context"

interface UserDataDialogProps {
  open: boolean
  onSave: (userData: UserData) => void
  defaultValues?: Partial<UserData>
}

export function UserDataDialog({ open, onSave, defaultValues = {} }: UserDataDialogProps) {
  const [userId, setUserId] = useState(defaultValues.userId || "user123")
  const [userorgId, setUserorgId] = useState(defaultValues.userorgId || "org456")
  const [email, setEmail] = useState(defaultValues.email || "user@bexapp.de")
  const [isAdmin, setIsAdmin] = useState(defaultValues.roles?.includes("admin") || true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const userData: UserData = {
      userId,
      userorgId,
      email,
      roles: isAdmin ? ["admin", "user"] : ["user"],
    }

    onSave(userData)
  }

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>User Information</DialogTitle>
            <DialogDescription>
              No user data was received from the parent application. Please enter your information manually.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="userId" className="text-right">
                User ID
              </Label>
              <Input
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="userorgId" className="text-right">
                Organization ID
              </Label>
              <Input
                id="userorgId"
                value={userorgId}
                onChange={(e) => setUserorgId(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="text-right">
                <Label>Roles</Label>
              </div>
              <div className="col-span-3 flex items-center space-x-2">
                <Checkbox id="admin" checked={isAdmin} onCheckedChange={(checked) => setIsAdmin(checked as boolean)} />
                <Label htmlFor="admin">Admin</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Save and Continue</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

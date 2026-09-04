import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import {
  changeUserPassword,
  createMembership,
  createUser,
  deleteMembership,
  fetchMembership,
  fetchMemberships,
  fetchUser,
  fetchUsers,
  type MembershipFilters,
  type UserFilters,
  updateMembership,
  updateUser,
} from "@/modules/users/api/users.api";
import type {
  MembershipFormValues,
  UserFormValues,
  UserPasswordValues,
} from "@/modules/users/schemas/users.schemas";

export const USERS_QUERY_KEY = ["admin", "users"] as const;
export const MEMBERSHIPS_QUERY_KEY = ["admin", "memberships"] as const;

export const useUsersQuery = (filters: UserFilters) => {
  const token = useAuthStore((state) => state.accessToken);
  return useQuery({
    queryKey: [...USERS_QUERY_KEY, filters],
    queryFn: () => fetchUsers(token ?? "", filters),
    enabled: Boolean(token),
  });
};

export const useUserQuery = (id?: string) => {
  const token = useAuthStore((state) => state.accessToken);
  return useQuery({
    queryKey: [...USERS_QUERY_KEY, id],
    queryFn: () => fetchUser(token ?? "", id ?? ""),
    enabled: Boolean(token && id),
  });
};

export const useCreateUserMutation = () => {
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UserFormValues) => createUser(token ?? "", payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY }),
  });
};

export const useUpdateUserMutation = () => {
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; values: UserFormValues }) =>
      updateUser(token ?? "", input.id, input.values),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY }),
  });
};

export const useChangeUserPasswordMutation = () => {
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; values: UserPasswordValues }) =>
      changeUserPassword(token ?? "", input.id, input.values),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY }),
  });
};

export const useMembershipsQuery = (filters: MembershipFilters) => {
  const token = useAuthStore((state) => state.accessToken);
  return useQuery({
    queryKey: [...MEMBERSHIPS_QUERY_KEY, filters],
    queryFn: () => fetchMemberships(token ?? "", filters),
    enabled: Boolean(token),
  });
};

export const useMembershipQuery = (id?: string) => {
  const token = useAuthStore((state) => state.accessToken);
  return useQuery({
    queryKey: [...MEMBERSHIPS_QUERY_KEY, id],
    queryFn: () => fetchMembership(token ?? "", id ?? ""),
    enabled: Boolean(token && id),
  });
};

export const useCreateMembershipMutation = () => {
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: MembershipFormValues) =>
      createMembership(token ?? "", payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: MEMBERSHIPS_QUERY_KEY }),
  });
};

export const useUpdateMembershipMutation = () => {
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; values: MembershipFormValues }) =>
      updateMembership(token ?? "", input.id, input.values),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: MEMBERSHIPS_QUERY_KEY }),
  });
};

export const useDeleteMembershipMutation = () => {
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMembership(token ?? "", id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: MEMBERSHIPS_QUERY_KEY }),
  });
};

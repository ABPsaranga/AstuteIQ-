import { useQuery } from '@tanstack/react-query'
import {
  getBillingOverview,
  getPlans,
  getTransactions,
} from './api'

export const useBillingOverview = () =>
  useQuery({
    queryKey: ['billing-overview'],
    queryFn: getBillingOverview,
  })

export const usePlans = () =>
  useQuery({
    queryKey: ['billing-plans'],
    queryFn: getPlans,
  })

export const useTransactions = () =>
  useQuery({
    queryKey: ['billing-transactions'],
    queryFn: getTransactions,
  })
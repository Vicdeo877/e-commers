"use client";

import Link from "next/link";
import { XCircle, RefreshCw, ShoppingCart, HelpCircle } from "lucide-react";

export default function OrderFailedPage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <XCircle className="w-14 h-14 text-red-500" />
      </div>
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Payment Failed</h1>
      <p className="text-gray-500 mb-8">
        Your payment could not be processed. No amount has been charged.<br />
        Please try again or choose a different payment method.
      </p>

      <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-8 text-sm text-red-700 text-left space-y-1">
        <p className="font-semibold mb-2">Common reasons for failure:</p>
        <p>• Insufficient balance or card limit exceeded</p>
        <p>• Payment cancelled by user</p>
        <p>• Bank declined the transaction</p>
        <p>• Network timeout during payment</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/checkout"
          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors">
          <RefreshCw className="w-4 h-4" /> Try Again
        </Link>
        <Link href="/cart"
          className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-6 py-3 rounded-xl font-semibold transition-colors">
          <ShoppingCart className="w-4 h-4" /> Back to Cart
        </Link>
        <Link href="/contact"
          className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-6 py-3 rounded-xl font-semibold transition-colors">
          <HelpCircle className="w-4 h-4" /> Get Help
        </Link>
      </div>
    </div>
  );
}
